# **App Name**: StockSight

## Core Features:

- Key Metrics Display: Displays the key metrics (Ticker, Current Price, Day's Change) of a given stock
- Options Chain Table: Dynamically presents formatted option chain data for calls and puts, with strike prices sorted in descending order.
- AI-Powered Technical Analysis: Analyzes stock data and calculates pivot points (PP, S1-S3, R1-R3) for technical analysis as a tool.
- AI Key Takeaways Generation: Provides AI-generated key insights (5 takeaways) about a stock, emphasizing sentiment.
- Contextual AI Chatbot: Acts as a contextual chatbot to answer the questions related to the stock using latest stock info and past analysis
- Data Source Selection & JSON Display: Allows users to choose different data sources and see the raw JSON output in the Debug tab
- Data Export: Ability to copy JSON and export formatted key takeaways or the Options Chain table as CSV.

## Style Guidelines:

- Primary color: HSL(210, 75%, 50%) -> RGB(#3283F6), a vibrant blue associated with trust and financial insight.
- Background color: HSL(210, 20%, 95%) -> RGB(#F0F4FF), a light, desaturated blue that provides a clean and professional backdrop.
- Accent color: HSL(180, 65%, 45%) -> RGB(#2DC7C7), an energetic green as a signal of potential profit.
- Headline font: 'Space Grotesk' (sans-serif), lending the UI a computerized, techy feel.
- Body font: 'Inter' (sans-serif) for main content because its objective, neutral style aids readability of the numbers.
- Code font: 'Source Code Pro' (monospace) for displaying JSON in debug tab.
- Emphasize clear and structured layout, with dedicated cards for Key Metrics, AI Analysis, and Options Chain.
- Tabbed interface (ShadCN Tabs) for easy switching between data and raw JSON information in 'Main' and 'Debug' tabs.
- Utilize modern and clean icons (Lucide React) to represent financial metrics, analysis types, and export functions.