export const DOMAINS = [
  "Marine",
  "Custom",
  "Rail",
  "Road",
  "Air"
] as const;

export type Domain = typeof DOMAINS[number];

export const TRANSPORT_DATA = {
  "United States": {
    Marine: ["Port of Los Angeles", "Port of Long Beach", "Port of New York", "Port of Savannah", "Port of Houston"],
    Rail: ["Grand Central Terminal", "Union Station Chicago", "Penn Station NY", "South Station Boston"],
    Air: ["JFK Airport", "LAX Airport", "O'Hare Airport", "Atlanta Airport", "Dallas/Fort Worth"],
    Road: ["Interstate 95 Hub", "Interstate 10 Hub", "Route 66 Station"],
    Custom: ["Customs - LA", "Customs - NY", "Customs - Miami"]
  },
  "United Kingdom": {
    Marine: ["Port of Felixstowe", "Port of Southampton", "Port of London", "Port of Liverpool"],
    Rail: ["King's Cross", "Paddington Station", "Waterloo Station", "Victoria Station"],
    Air: ["Heathrow Airport", "Gatwick Airport", "Manchester Airport", "Birmingham Airport"],
    Road: ["M1 Hub", "M25 Hub", "A1 Station"],
    Custom: ["Customs - Dover", "Customs - Heathrow", "Customs - Southampton"]
  },
  "China": {
    Marine: ["Port of Shanghai", "Port of Shenzhen", "Port of Ningbo", "Port of Guangzhou", "Port of Qingdao"],
    Rail: ["Beijing Railway Station", "Shanghai Hongqiao", "Guangzhou South", "Shenzhen North"],
    Air: ["Beijing Capital Airport", "Shanghai Pudong", "Guangzhou Baiyun", "Shenzhen Bao'an"],
    Road: ["G1 Beijing Hub", "G15 Shanghai Hub", "G4 Guangzhou Hub"],
    Custom: ["Customs - Shanghai", "Customs - Shenzhen", "Customs - Beijing"]
  },
  "Singapore": {
    Marine: ["Port of Singapore", "Jurong Port", "Pasir Panjang Terminal"],
    Rail: ["Woodlands Train Checkpoint", "Tanjong Pagar Station"],
    Air: ["Changi Airport", "Seletar Airport"],
    Road: ["Tuas Checkpoint", "Woodlands Checkpoint"],
    Custom: ["Customs - Changi", "Customs - Tuas", "Customs - Woodlands"]
  },
  "Germany": {
    Marine: ["Port of Hamburg", "Port of Bremen", "Port of Wilhelmshaven"],
    Rail: ["Berlin Hauptbahnhof", "Frankfurt Central", "Munich Central", "Hamburg Central"],
    Air: ["Frankfurt Airport", "Munich Airport", "Berlin Brandenburg", "Düsseldorf Airport"],
    Road: ["A1 Autobahn Hub", "A3 Frankfurt Hub", "A8 Munich Hub"],
    Custom: ["Customs - Hamburg", "Customs - Frankfurt", "Customs - Munich"]
  },
  "Japan": {
    Marine: ["Port of Tokyo", "Port of Yokohama", "Port of Nagoya", "Port of Osaka", "Port of Kobe"],
    Rail: ["Tokyo Station", "Shinjuku Station", "Osaka Station", "Nagoya Station", "Kyoto Station"],
    Air: ["Narita Airport", "Haneda Airport", "Kansai Airport", "Chubu Centrair"],
    Road: ["Tomei Expressway Hub", "Meishin Expressway Hub"],
    Custom: ["Customs - Tokyo", "Customs - Osaka", "Customs - Nagoya"]
  },
  "Netherlands": {
    Marine: ["Port of Rotterdam", "Port of Amsterdam", "Port of Vlissingen"],
    Rail: ["Amsterdam Central", "Rotterdam Central", "Utrecht Central"],
    Air: ["Amsterdam Schiphol", "Rotterdam The Hague Airport", "Eindhoven Airport"],
    Road: ["A4 Hub", "A2 Hub", "A1 Hub"],
    Custom: ["Customs - Rotterdam", "Customs - Schiphol", "Customs - Amsterdam"]
  },
  "India": {
    Marine: ["Jawaharlal Nehru Port", "Mundra Port", "Chennai Port", "Visakhapatnam Port", "Kolkata Port"],
    Rail: ["Chhatrapati Shivaji Terminus", "New Delhi Station", "Howrah Junction", "Chennai Central"],
    Air: ["Indira Gandhi Airport", "Mumbai Airport", "Bangalore Airport", "Chennai Airport"],
    Road: ["Golden Quadrilateral - Delhi Hub", "NH44 Hub", "NH48 Hub"],
    Custom: ["Customs - Mumbai", "Customs - Delhi", "Customs - Chennai"]
  },
  "UAE": {
    Marine: ["Port of Jebel Ali", "Port Khalifa", "Port of Fujairah", "Port Rashid"],
    Rail: ["Dubai Metro Central", "Abu Dhabi Central"],
    Air: ["Dubai International", "Abu Dhabi International", "Sharjah Airport", "Al Maktoum Airport"],
    Road: ["E11 Sheikh Zayed Hub", "E311 Dubai Hub"],
    Custom: ["Customs - Jebel Ali", "Customs - Dubai Airport", "Customs - Abu Dhabi"]
  },
  "Australia": {
    Marine: ["Port of Melbourne", "Port Botany Sydney", "Port of Brisbane", "Port of Fremantle"],
    Rail: ["Sydney Central", "Melbourne Southern Cross", "Brisbane Central"],
    Air: ["Sydney Airport", "Melbourne Airport", "Brisbane Airport", "Perth Airport"],
    Road: ["M1 Pacific Motorway Hub", "M2 Sydney Hub"],
    Custom: ["Customs - Sydney", "Customs - Melbourne", "Customs - Brisbane"]
  }
};

export const COUNTRIES = Object.keys(TRANSPORT_DATA) as Array<keyof typeof TRANSPORT_DATA>;
