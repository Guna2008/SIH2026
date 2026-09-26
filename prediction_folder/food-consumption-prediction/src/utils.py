from pathlib import Path


def create_directories(*directories):
    """
    Create directories if they don't exist.
    """

    for directory in directories:

        Path(directory).mkdir(
            parents=True,
            exist_ok=True
        )


def print_section(title):
    """
    Print a formatted section heading.
    """

    print()
    print("=" * 60)
    print(title)
    print("=" * 60)