# Hostel Food Consumption Prediction

Machine learning project for predicting the number of students
who will consume a hostel meal.

## Objective

Predict the number of food consumers based on:

- Day of week
- Meal type
- Dish
- Special day
- Total students
- Students on leave

## Target

`Persons_Consumed`

## Machine Learning Model

Random Forest Regressor

## Dataset

The dataset contains 2,000 meal records.

## Project Structure

```text
food-consumption-prediction/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── models/
│
├── src/
│   ├── config.py
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   └── utils.py
│
├── tests/
├── notebooks/
├── requirements.txt
└── README.md