# QUANTA-Fusion

A professional-grade quantitative finance research platform built on a
multi-API data layer and 10 institutional quant models.

## Features
- Real-time stock data via Alpha Vantage, Finnhub, and Twelvedata
- Live blockchain explorer via Etherscan and Blockchair
- 10 quant models: Avellaneda-Stoikov, HMM Regime, HAR-RV, Meta-Labeling and more
- Sentiment analysis with VADER + Finnhub news
- Streamlit multi-page dashboard
- Flask REST API with backward-compatible routes

## Setup

### 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/QUANTA-Fusion.git
cd QUANTA-Fusion

### 2. Create virtual environment
python -m venv venv
venv\Scripts\activate

### 3. Install dependencies
pip install -r requirements.txt

### 4. Configure API keys
copy config\settings.example.yaml config\settings.yaml
# Edit config/settings.yaml and add your API keys

### 5. Run the backend
cd backend
python app.py

### 6. Run the Streamlit UI
streamlit run quanta_fusion/ui/app.py

## API Keys Required
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- Finnhub: https://finnhub.io/register
- Twelvedata: https://twelvedata.com/register
- Etherscan: https://etherscan.io/register
- Blockchair: https://blockchair.com/api (free tier, no key needed)

## Project Structure
See docs/architecture.md for the full 6-layer architecture breakdown.

## License
MIT
