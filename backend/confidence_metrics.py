import pandas as pd

def generate_confidence_metrics(sequence: str, plddt_scores: list[float]) -> dict:
    """
    Generates confidence metrics for interactive gauges and per-residue sparkline chart.
    This fulfills the Confidence Metrics objective from the README:
    'Interactive gauges and a per-residue sparkline chart with detailed residue tooltips 
    showing amino acid letters and confidence classifications.'
    """
    if len(sequence) != len(plddt_scores):
        raise ValueError("Sequence length must match pLDDT scores length")
        
    # Build dataframe for per-residue mapping
    df = pd.DataFrame({
        "residue_letter": list(sequence),
        "confidence_score": plddt_scores
    })
    
    # Classify confidence into four typical standard categories
    def get_classification(score):
        if score > 90:
            return "Very High"
        elif score > 70:
            return "Confident"
        elif score > 50:
            return "Low"
        else:
            return "Very Low"
            
    df["classification"] = df["confidence_score"].apply(get_classification)
    
    # 1. Sparkline chart data with tooltips (amino acid letters and confidence classifications)
    sparkline_chart_data = df.to_dict(orient="records")
    
    # 2. Interactive gauges metrics (percentages of each classification)
    total = len(df)
    gauges_data = {
        "very_high": float(df[df["classification"] == "Very High"].shape[0] / total * 100) if total else 0.0,
        "confident": float(df[df["classification"] == "Confident"].shape[0] / total * 100) if total else 0.0,
        "low": float(df[df["classification"] == "Low"].shape[0] / total * 100) if total else 0.0,
        "very_low": float(df[df["classification"] == "Very Low"].shape[0] / total * 100) if total else 0.0,
    }
    
    return {
        "sparkline_chart": sparkline_chart_data,
        "gauges": gauges_data,
        "mean_score": float(df["confidence_score"].mean()) if total else 0.0
    }
