
from __future__ import annotations
import json, math, os
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
import pandas as pd
from ..database import settings

ROOT = Path(__file__).resolve().parents[3]
_CONSUMER = None
_RECOMMENDER = None

def _load_models():
    global _CONSUMER, _RECOMMENDER
    if _CONSUMER is None:
        path = ROOT / "food-consumption-prediction" / "models" / "food_consumer_model.pkl"
        if path.exists():
            try:
                import joblib
                _CONSUMER = joblib.load(path)
            except Exception:
                _CONSUMER = False
        else: _CONSUMER = False
    if _RECOMMENDER is None:
        path = ROOT / "recommendation model" / "foodwise_improved_model.pkl"
        if path.exists():
            try:
                import joblib
                _RECOMMENDER = joblib.load(path)
            except Exception:
                _RECOMMENDER = False
        else: _RECOMMENDER = False
    return _CONSUMER, _RECOMMENDER

def _post_json(url: str | None, payload: dict, timeout: float = 4.0) -> dict | None:
    if not url: return None
    try:
        req = Request(url, data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"}, method="POST")
        with urlopen(req, timeout=timeout) as response: return json.loads(response.read().decode())
    except Exception: return None

def predict_surplus(features: dict) -> dict:
    external = _post_json(settings.SURPLUS_MODEL_URL, features)
    if external and "predicted_required_quantity" in external:
        required = float(external["predicted_required_quantity"]); source = "configured-model-api"
    else:
        consumer, _ = _load_models()
        required = None
        if consumer and consumer is not False:
            try:
                frame = pd.DataFrame([{
                    "Day_of_Week": features["day_of_week"], "Meal_Type": (features.get("meal_type") or "Lunch").title(),
                    "Dish": features["dish"], "Special_Day": "Yes" if features.get("special_day") else "No",
                    "Total_Students": int(features["total_students"]), "Students_on_Leave": int(features["students_on_leave"]),
                }])
                required = float(consumer.predict(frame)[0]); source = "food-consumer-pkl"
            except Exception:
                required = None
        if required is None:
            required = float(max(0, int(features.get("students_staying", 0)))); source = "safe-baseline"
    required = max(0.0, min(required, float(max(0, int(features.get("total_students", 0))-int(features.get("students_on_leave",0))))))
    prepared = features.get("prepared_quantity")
    surplus = max(0.0, float(prepared)-required) if prepared is not None else 0.0
    return {"predicted_required_quantity": required, "predicted_surplus_quantity": surplus,
            "recommendation": f"Model estimates {required:.0f} portions needed" + (f"; estimated surplus is {surplus:.0f}." if prepared is not None else "."), "source": source}

def _route_metrics(food, recipient):
    lat1, lon1 = food.get("provider_latitude"), food.get("provider_longitude")
    lat2, lon2 = recipient.get("ngo_latitude", recipient.get("latitude")), recipient.get("ngo_longitude", recipient.get("longitude"))
    if None in (lat1,lon1,lat2,lon2): return None, None
    r=6371; p1,p2=math.radians(float(lat1)),math.radians(float(lat2)); dp=math.radians(float(lat2)-float(lat1)); dl=math.radians(float(lon2)-float(lon1))
    a=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    km=2*r*math.asin(min(1,math.sqrt(a)))
    # OSRM public routing API; timeout and fallback are explicit.
    try:
        url=f"https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        with urlopen(url, timeout=3) as resp: data=json.loads(resp.read().decode())
        route=data.get("routes",[])
        if route: return route[0]["distance"]/1000, route[0]["duration"]/60
    except Exception: pass
    return km, (km/25*60 if km else 0)

def match_food(foods: list[dict], ngo_features: dict) -> list[dict]:
    external=_post_json(settings.NGO_MATCH_MODEL_URL,{"ngo":ngo_features,"foods":foods})
    external_map={int(x["food_id"]):x for x in external.get("matches",[]) if "food_id" in x} if external and isinstance(external.get("matches"),list) else {}
    _, model=_load_models()
    eligible=[]
    for food in foods:
        food=dict(food)
        dist, mins=_route_metrics(food,ngo_features)
        if dist is not None: food["distance_km"]=round(dist,2); food["travel_time_min"]=round(mins,1)
        maxdist=float(ngo_features.get("max_distance_km") or 15)
        quantity=float(food.get("remaining_quantity",food.get("quantity",0)) or 0)
        capacity = float(ngo_features.get("capacity") or ngo_features.get("recipient_capacity") or 0)
        capacity_limit = (capacity + 15) if capacity > 0 else 0
        ftype = str(food.get("food_type","")).lower(); pref = str(ngo_features.get("food_preferences","ANY")).lower()
        type_match = int(pref in ("any","anything","both","") or pref in ftype or ("veg" in pref and "non" not in pref and "non" not in ftype))
        distance_ok = int(dist is None or dist <= maxdist)
        claimable_qty = min(quantity, capacity_limit) if capacity_limit > 0 else quantity
        capacity_ok = 1 if claimable_qty > 0 else 0
        minimum = float(ngo_features.get("min_food_required") or 0)
        min_ok = int(quantity >= minimum)
        pickup = int(bool(food.get("pickup_available",True)))
        eligible_flag = type_match and distance_ok and capacity_ok and min_ok and pickup
        if not eligible_flag: continue
        row = {"veg_nonveg": "Non-Veg" if "non" in ftype else "Veg", "recipient_type": str(ngo_features.get("recipient_type", "NGO")),
          "food_quantity": claimable_qty, "recipient_capacity": capacity_limit, "pickup_available": pickup, "min_food_required": minimum,
          "max_distance_km": maxdist, "distance_km": dist if dist is not None else maxdist, "travel_time_min": mins if mins is not None else 999,
          "food_type_match": type_match, "capacity_ok": capacity_ok, "quantity_ratio": claimable_qty/capacity_limit if capacity_limit else 1.0,
          "minimum_quantity_ok": min_ok, "distance_ok": distance_ok, "capacity_remaining": max(0, capacity_limit - claimable_qty) if capacity_limit else 0,
          "travel_efficiency": (mins/max(dist,0.5)) if mins is not None and dist is not None else 999, "basic_eligible": 1}
        match=external_map.get(int(food.get("id",-1)))
        try:
            if match: score=float(match.get("score",0)); src="configured-model-api"
            elif model and model is not False:
                frame=pd.DataFrame([row],columns=["veg_nonveg","recipient_type","food_quantity","recipient_capacity","pickup_available","min_food_required","max_distance_km","distance_km","travel_time_min","food_type_match","capacity_ok","quantity_ratio","minimum_quantity_ok","distance_ok","capacity_remaining","travel_efficiency","basic_eligible"])
                score=float(model.predict_proba(frame)[0][1]); src="recommendation-pkl"
            else: score=max(0,1-(dist or 0)/max(maxdist,1))*.7+min(quantity/max(capacity,1),1)*.3; src="safe-baseline"
        except Exception: score=0.0; src="safe-baseline"
        food["match_score"]=round(score*100 if score<=1 else score,1); food["match_reason"]=f"Eligible by food preference, quantity, pickup and distance; estimated road travel {mins:.0f} min." if mins is not None else "Eligible by configured recipient rules; road route unavailable."; food["recommendation_source"]=src
        eligible.append(food)
    return sorted(eligible,key=lambda x:x.get("match_score",0),reverse=True)

def expiry_urgency(expiry_date: datetime | None, now: datetime) -> tuple[str,int|None,str]:
    if expiry_date is None: return "UNKNOWN",None,"Expiry date is missing. Verify before use."
    days=(expiry_date.replace(tzinfo=None).date()-now.replace(tzinfo=None).date()).days
    if days<0:return "EXPIRED",days,"Expired: exclude from human consumption and route to biogas-only handling."
    if days<=2:return "URGENT",days,"Use first only if safe and within date."
    if days<=7:return "SOON",days,"Prioritize before later-expiring stock."
    return "NORMAL",days,"Use after earlier-expiring stock."

def rank_expiry_batches(batches: list[dict]) -> list[dict]:
    result=_post_json(settings.EXPIRY_MODEL_URL,{"batches":batches})
    if result and isinstance(result.get("batches"),list):
        order={int(x["batch_id"]):i for i,x in enumerate(result["batches"]) if "batch_id" in x}
        for b in batches:
            if b.get("expiry_date") and str(b["expiry_date"])[:10] < datetime.now().date().isoformat(): b["recommendation"]="EXPIRED — biogas only; never distribute for human consumption."
        return sorted(batches,key=lambda x:(str(x.get("recommendation","")).startswith("EXPIRED"),order.get(x["batch_id"],10**9)))
    return sorted(batches,key=lambda x:(x.get("expiry_date") is None,x.get("expiry_date") or "9999-12-31"))
