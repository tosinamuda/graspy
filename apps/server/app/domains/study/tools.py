from datetime import datetime
import math

class Calculator:
    name = "Calculator"
    input_variable = "expression"
    desc = "evaluates a mathematical expression. Input should be a valid python math expression string."

    def __call__(self, expression: str) -> str:
        try:
            # Safe evaluation with limited globals
            allowed_names = {"math": math, "abs": abs, "round": round, "min": min, "max": max}
            code = compile(expression, "<string>", "eval")
            for name in code.co_names:
                if name not in allowed_names:
                    raise NameError(f"Use of {name} is not allowed")
            return str(eval(code, {"__builtins__": {}}, allowed_names))
        except Exception as e:
            return f"Error calculating: {str(e)}"

class CurrentTime:
    name = "CurrentTime"
    input_variable = "query"
    desc = "returns the current date and time. Input can be ignored."

    def __call__(self, query: str = "") -> str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
