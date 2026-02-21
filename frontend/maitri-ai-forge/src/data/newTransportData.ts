export const DOMAINS = [
  "Marine",
  "Custom",
  "Rail",
  "Road",
  "Air"
] as const;

export type Domain = typeof DOMAINS[number];

// Labels for each domain type
export const DOMAIN_LABELS = {
  Marine: {
    location: "Port",
    detail: "Terminal"
  },
  Air: {
    location: "Airport",
    detail: "Terminal"
  },
  Rail: {
    location: "Station",
    detail: "Platform"
  },
  Road: {
    location: "Hub",
    detail: "Loading Bay"
  },
  Custom: {
    location: "Customs Point",
    detail: "Inspection Area"
  }
} as const;

// Terminal/Gate/Platform data for each location
export const LOCATION_DETAILS: Record<string, string[]> = {
  // United States - Marine
  "Port of Los Angeles": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5", "Terminal 6", "Terminal 7", "Terminal 8"],
  "Port of Long Beach": ["Terminal A", "Terminal B", "Terminal C", "Terminal D", "Terminal E", "Terminal F"],
  "Port of New York/New Jersey": ["Port Newark", "Elizabeth Marine Terminal", "Howland Hook", "Red Hook Container Terminal", "Brooklyn Cruise Terminal"],
  "Port of Savannah": ["Ocean Terminal", "Garden City Terminal", "North Terminal", "South Terminal"],
  "Port of Houston": ["Barbours Cut Terminal", "Bayport Terminal", "Turning Basin Terminal", "Care Terminal"],
  "Port of Seattle": ["Terminal 5", "Terminal 18", "Terminal 30", "Terminal 46", "Terminal 91"],
  "Port of Oakland": ["Oakland International Container Terminal", "SSA Terminal", "Matson Terminal", "Evergreen Terminal"],
  "Port of Charleston": ["Wando Welch Terminal", "North Charleston Terminal", "Columbus Street Terminal", "Hugh K. Leatherman Terminal"],
  "Port of Virginia": ["Virginia International Gateway", "Norfolk International Terminals", "Portsmouth Marine Terminal", "Newport News Marine Terminal"],
  "Port of Miami": ["Dodge Island", "PortMiami Terminal", "Royal Caribbean Terminal", "Carnival Cruise Terminal"],
  
  // United States - Rail
  "Grand Central Terminal": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Union Station Chicago": ["Platform A", "Platform B", "Platform C", "Platform D", "Platform E", "Platform F", "Platform G", "Platform H"],
  "Penn Station NY": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "South Station Boston": ["Track 1", "Track 2", "Track 3", "Track 4", "Track 5", "Track 6", "Track 7", "Track 8"],
  "Union Station Washington DC": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8"],
  "30th Street Station Philadelphia": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6"],
  "Los Angeles Union Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8"],
  "Denver Union Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8"],
  "King Street Station Seattle": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
  "San Francisco 4th and King": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6"],
  
  // United States - Air
  "JFK Airport": ["Terminal 1", "Terminal 2", "Terminal 4", "Terminal 5", "Terminal 7", "Terminal 8"],
  "LAX Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5", "Terminal 6", "Terminal 7", "Terminal 8", "Tom Bradley International Terminal"],
  "O'Hare Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 5"],
  "Atlanta Airport": ["Domestic Terminal North", "Domestic Terminal South", "Concourse A", "Concourse B", "Concourse C", "Concourse D", "Concourse E", "Concourse F", "Concourse T", "International Terminal"],
  "Dallas/Fort Worth": ["Terminal A", "Terminal B", "Terminal C", "Terminal D", "Terminal E"],
  "Denver International": ["Concourse A", "Concourse B", "Concourse C", "Main Terminal"],
  "San Francisco International": ["Terminal 1", "Terminal 2", "Terminal 3", "International Terminal G", "International Terminal A"],
  "Miami International": ["North Terminal", "Central Terminal", "South Terminal", "Concourse D", "Concourse E", "Concourse F", "Concourse G", "Concourse H", "Concourse J"],
  "Seattle-Tacoma International": ["Concourse A", "Concourse B", "Concourse C", "Concourse D", "North Satellite", "South Satellite"],
  "Newark Liberty International": ["Terminal A", "Terminal B", "Terminal C"],
  
  // United States - Road
  "Interstate 95 Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "Interstate 10 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6", "Dock 7", "Dock 8"],
  "Route 66 Station": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "Chicago Logistics Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4", "Loading Zone 5"],
  "Memphis Distribution Center": ["Dock A", "Dock B", "Dock C", "Dock D", "Dock E", "Dock F"],
  "Atlanta Freight Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6", "Bay 7", "Bay 8"],
  "Dallas Logistics Hub": ["Loading Bay North", "Loading Bay South", "Loading Bay East", "Loading Bay West", "Central Dock"],
  "Los Angeles Freight Terminal": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"],
  "Portland Distribution Hub": ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"],
  "Phoenix Logistics Center": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // United States - Custom
  "Customs - Los Angeles": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - New York": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D", "Processing Zone E"],
  "Customs - Miami": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4", "Checkpoint 5"],
  "Customs - Chicago": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - Houston": ["Processing Area 1", "Processing Area 2", "Processing Area 3", "Processing Area 4"],
  "Customs - Seattle": ["Inspection Zone A", "Inspection Zone B", "Inspection Zone C", "Inspection Zone D"],
  "Customs - San Francisco": ["Checkpoint A", "Checkpoint B", "Checkpoint C", "Checkpoint D", "Checkpoint E"],
  "Customs - Atlanta": ["Inspection Area North", "Inspection Area South", "Inspection Area East", "Inspection Area West"],
  "Customs - Newark": ["Processing Bay 1", "Processing Bay 2", "Processing Bay 3", "Processing Bay 4"],
  "Customs - Detroit": ["Inspection Zone 1", "Inspection Zone 2", "Inspection Zone 3"],
  
  // United Kingdom - Marine
  "Port of Felixstowe": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5", "Terminal 6"],
  "Port of Southampton": ["Container Terminal", "Vehicle Terminal", "Cruise Terminal", "Bulk Terminal", "Oil Terminal"],
  "Port of London": ["Thames Terminal", "Gateway Terminal", "Tilbury Terminal", "London Gateway", "Royal Docks"],
  "Port of Liverpool": ["Royal Seaforth Container Terminal", "Liverpool2", "Gladstone Dock", "Alexandra Dock", "Stanley Dock"],
  "Port of Immingham": ["Immingham Bulk Terminal", "Immingham Container Terminal", "Immingham Oil Terminal"],
  "Port of Dover": ["Eastern Docks", "Western Docks", "Cruise Terminal 1", "Cruise Terminal 2", "Freight Terminal"],
  "Port of Grimsby": ["Grimsby Royal Dock", "Grimsby Fish Dock", "Container Terminal"],
  "Port of Tilbury": ["Tilbury Container Terminal", "Tilbury Grain Terminal", "Tilbury Cruise Terminal"],
  "Port of Belfast": ["Victoria Terminal 1", "Victoria Terminal 2", "Victoria Terminal 3", "Stormont Terminal"],
  "Port of Aberdeen": ["Aberdeen South Harbour", "Aberdeen North Harbour", "Aberdeen Cruise Terminal"],
  
  // United Kingdom - Rail
  "London King's Cross": ["Platform 0", "Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "London Paddington": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14"],
  "London Waterloo": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "London Victoria": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19"],
  "London Euston": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18"],
  "London Liverpool Street": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18"],
  "Birmingham New Street": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Manchester Piccadilly": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14"],
  "Edinburgh Waverley": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20"],
  "Glasgow Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17"],
  
  // United Kingdom - Air
  "Heathrow Airport": ["Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"],
  "Gatwick Airport": ["North Terminal", "South Terminal"],
  "Manchester Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Birmingham Airport": ["Main Terminal"],
  "Stansted Airport": ["Main Terminal", "Satellite Terminal"],
  "Luton Airport": ["Main Terminal"],
  "Edinburgh Airport": ["Main Terminal"],
  "Glasgow Airport": ["Main Terminal"],
  "Bristol Airport": ["Main Terminal"],
  "Newcastle Airport": ["Main Terminal"],
  
  // United Kingdom - Road
  "M1 Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "M25 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6", "Dock 7", "Dock 8"],
  "A1 Station": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "M6 Logistics Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4", "Loading Zone 5"],
  "M4 Freight Terminal": ["Dock A", "Dock B", "Dock C", "Dock D", "Dock E"],
  "M62 Distribution Center": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6", "Bay 7", "Bay 8"],
  "M5 Logistics Park": ["Loading Bay North", "Loading Bay South", "Loading Bay East", "Loading Bay West"],
  "A14 Freight Hub": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "M40 Logistics Hub": ["Zone A", "Zone B", "Zone C", "Zone D"],
  "M8 Distribution Center": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // United Kingdom - Custom
  "Customs - Dover": ["Channel 1", "Channel 2", "Channel 3", "Channel 4", "Channel 5"],
  "Customs - Heathrow": ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"],
  "Customs - Southampton": ["Area 1", "Area 2", "Area 3", "Area 4"],
  "Customs - Felixstowe": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - London Gateway": ["Processing Zone 1", "Processing Zone 2", "Processing Zone 3"],
  "Customs - Manchester": ["Checkpoint A", "Checkpoint B", "Checkpoint C", "Checkpoint D"],
  "Customs - Birmingham": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4"],
  "Customs - Liverpool": ["Processing Bay 1", "Processing Bay 2", "Processing Bay 3"],
  "Customs - Tilbury": ["Inspection Zone 1", "Inspection Zone 2", "Inspection Zone 3", "Inspection Zone 4"],
  "Customs - Immingham": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3"],
  
  // China - Marine
  "Port of Shanghai": ["Yangshan Deep Water Port", "Waigaoqiao Terminal", "Pudong International Container Terminal", "Shengdong Terminal", "Zhendong Terminal"],
  "Port of Shenzhen": ["Yantian Terminal", "Shekou Terminal", "Chiwan Terminal", "Dachan Bay Terminal", "Mawan Terminal"],
  "Port of Ningbo-Zhoushan": ["Beilun Terminal", "Daxie Terminal", "Chuanshan Terminal", "Meishan Terminal"],
  "Port of Guangzhou": ["Nansha Terminal", "Huangpu Terminal", "Xinsha Terminal", "Xingang Terminal"],
  "Port of Qingdao": ["Qianwan Terminal", "Dongjiakou Terminal", "Huangdao Terminal", "Qingdao Port Container Terminal"],
  "Port of Tianjin": ["Tianjin Port Container Terminal", "Tianjin Port Alliance Terminal", "Tianjin Port Pacific International Container Terminal"],
  "Port of Dalian": ["Dalian Container Terminal", "Dalian Port Container Terminal", "Dayao Bay Terminal"],
  "Port of Xiamen": ["Haicang Terminal", "Dongdu Terminal", "Songyu Terminal", "Zhaoyu Terminal"],
  "Port of Hong Kong": ["Kwai Tsing Container Terminals", "CT9", "River Trade Terminal"],
  "Port of Lianyungang": ["Lianyungang Container Terminal", "Donglian Terminal", "Xilian Terminal"],
  
  // China - Rail
  "Beijing Railway Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8"],
  "Shanghai Hongqiao": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Guangzhou South": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "Shenzhen North": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Beijing South": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "Shanghai Railway Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Xi'an North": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18"],
  "Wuhan": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Chengdu East": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14"],
  "Nanjing South": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15"],
  
  // China - Air
  "Beijing Capital Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Shanghai Pudong": ["Terminal 1", "Terminal 2", "Satellite Terminal S1", "Satellite Terminal S2"],
  "Guangzhou Baiyun": ["Terminal 1", "Terminal 2"],
  "Shenzhen Bao'an": ["Terminal A", "Terminal B", "Terminal C", "Terminal D"],
  "Beijing Daxing": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"],
  "Shanghai Hongqiao Air": ["Terminal 1", "Terminal 2"],
  "Chengdu Tianfu": ["Terminal 1", "Terminal 2"],
  "Chengdu Shuangliu": ["Terminal 1", "Terminal 2"],
  "Xi'an Xianyang": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"],
  "Hangzhou Xiaoshan": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  
  // China - Road
  "G1 Beijing Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4", "Loading Zone 5", "Loading Zone 6"],
  "G15 Shanghai Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F", "Bay G", "Bay H"],
  "G4 Guangzhou Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  "G2 Beijing-Shanghai Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "G15 Shenyang-Haikou Hub": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "G45 Daqing-Guangzhou Hub": ["Dock A", "Dock B", "Dock C", "Dock D", "Dock E"],
  "G6 Beijing-Lhasa Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "G30 Lianyungang-Khorgas Hub": ["Loading Zone A", "Loading Zone B", "Loading Zone C", "Loading Zone D"],
  "G5 Beijing-Kunming Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5"],
  "G42 Shanghai-Chengdu Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6"],
  
  // China - Custom
  "Customs - Shanghai": ["Clearance Area 1", "Clearance Area 2", "Clearance Area 3", "Clearance Area 4", "Clearance Area 5"],
  "Customs - Shenzhen": ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"],
  "Customs - Beijing": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - Guangzhou": ["Processing Zone 1", "Processing Zone 2", "Processing Zone 3", "Processing Zone 4"],
  "Customs - Tianjin": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4"],
  "Customs - Ningbo": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4"],
  "Customs - Qingdao": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Xiamen": ["Inspection Bay A", "Inspection Bay B", "Inspection Bay C"],
  "Customs - Dalian": ["Processing Area 1", "Processing Area 2", "Processing Area 3"],
  "Customs - Hong Kong": ["Clearance Zone 1", "Clearance Zone 2", "Clearance Zone 3"],
  
  // Singapore - Marine
  "Port of Singapore": ["Tanjong Pagar Terminal", "Keppel Terminal", "Brani Terminal", "Pasir Panjang Terminal", "Jurong Port"],
  "Jurong Port": ["Jurong Port Terminal 1", "Jurong Port Terminal 2", "Jurong Port Terminal 3", "Jurong Port Terminal 4"],
  "Pasir Panjang Terminal": ["Pasir Panjang Terminal 1", "Pasir Panjang Terminal 2", "Pasir Panjang Terminal 3", "Pasir Panjang Terminal 4"],
  "Tuas Port": ["Tuas Port Phase 1", "Tuas Port Phase 2", "Tuas Port Phase 3", "Tuas Port Phase 4"],
  
  // Singapore - Rail
  "Woodlands Train Checkpoint": ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  "Tanjong Pagar Station": ["Platform 1", "Platform 2", "Platform 3"],
  "Jurong East MRT": ["Platform A", "Platform B", "Platform C", "Platform D"],
  "Raffles Place MRT": ["Platform A", "Platform B", "Platform C", "Platform D"],
  
  // Singapore - Air
  "Changi Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5", "Jewel"],
  "Seletar Airport": ["Main Terminal", "Passenger Terminal"],
  
  // Singapore - Road
  "Tuas Checkpoint": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4", "Checkpoint 5"],
  "Woodlands Checkpoint": ["Checkpoint A", "Checkpoint B", "Checkpoint C", "Checkpoint D", "Checkpoint E", "Checkpoint F"],
  "Changi Freight Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4"],
  "Jurong Logistics Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  "Pioneer Distribution Center": ["Zone A", "Zone B", "Zone C", "Zone D"],
  
  // Singapore - Custom
  "Customs - Changi": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4"],
  "Customs - Tuas": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3"],
  "Customs - Woodlands": ["Processing Zone A", "Processing Zone B", "Processing Zone C"],
  "Customs - Jurong": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - Keppel": ["Clearance Area 1", "Clearance Area 2"],
  
  // Germany - Marine
  "Port of Hamburg": ["Container Terminal Altenwerder", "Container Terminal Burchardkai", "Container Terminal Tollerort", "Eurogate Container Terminal"],
  "Port of Bremerhaven": ["Container Terminal I", "Container Terminal II", "Container Terminal III", "Container Terminal IV", "Container Terminal V"],
  "Port of Wilhelmshaven": ["JadeWeserPort", "Container Terminal Wilhelmshaven", "Nordhafen"],
  "Port of Lübeck": ["Skandinavienkai", "Konstinkai", "Hansakai", "Seelandkai"],
  "Port of Rostock": ["Rostock Overseas Port", "Rostock Port", "Ferry Terminal"],
  "Port of Kiel": ["Ostuferhafen", "Norwegenkai", "Schwedenkai", "Ostseekai"],
  "Port of Emden": ["Emden Harbor", "Automotive Terminal", "Container Terminal"],
  "Port of Brunsbüttel": ["Kiel Canal Terminal", "Oil Terminal", "Container Terminal"],
  "Port of Cuxhaven": ["Cuxhaven Cruise Terminal", "Cuxhaven Container Terminal", "Offshore Terminal"],
  "Port of Sassnitz": ["Sassnitz Ferry Terminal", "Sassnitz Container Terminal"],
  
  // Germany - Rail
  "Berlin Hauptbahnhof": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Frankfurt Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "Munich Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24", "Platform 25", "Platform 26", "Platform 27", "Platform 28", "Platform 29", "Platform 30", "Platform 31", "Platform 32"],
  "Hamburg Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Cologne Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Stuttgart Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Düsseldorf Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Leipzig Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "Nuremberg Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21"],
  "Dresden Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  
  // Germany - Air
  "Frankfurt Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Munich Airport": ["Terminal 1", "Terminal 2"],
  "Berlin Brandenburg": ["Terminal 1", "Terminal 2", "Terminal 5"],
  "Düsseldorf Airport": ["Terminal A", "Terminal B", "Terminal C"],
  "Hamburg Airport": ["Terminal 1", "Terminal 2"],
  "Cologne Bonn Airport": ["Terminal 1", "Terminal 2"],
  "Stuttgart Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "Hannover Airport": ["Terminal A", "Terminal B", "Terminal C"],
  "Nuremberg Airport": ["Terminal 1"],
  "Leipzig/Halle Airport": ["Terminal 1", "Terminal 2", "Cargo Terminal"],
  
  // Germany - Road
  "A1 Autobahn Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "A3 Frankfurt Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6", "Dock 7", "Dock 8"],
  "A8 Munich Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "A2 Dortmund Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4", "Loading Zone 5"],
  "A5 Frankfurt Hub": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "A7 Hamburg Hub": ["Dock A", "Dock B", "Dock C", "Dock D", "Dock E"],
  "A9 Nuremberg Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "A4 Cologne Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5"],
  "A10 Berlin Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6"],
  "A6 Mannheim Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4"],
  
  // Germany - Custom
  "Customs - Hamburg": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - Frankfurt": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Munich": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4"],
  "Customs - Bremerhaven": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - Düsseldorf": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "Customs - Stuttgart": ["Processing Area 1", "Processing Area 2", "Processing Area 3"],
  "Customs - Cologne": ["Checkpoint A", "Checkpoint B", "Checkpoint C"],
  "Customs - Berlin": ["Inspection Zone 1", "Inspection Zone 2", "Inspection Zone 3", "Inspection Zone 4"],
  "Customs - Leipzig": ["Clearance Area 1", "Clearance Area 2", "Clearance Area 3"],
  "Customs - Nuremberg": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  
  // Japan - Marine
  "Port of Tokyo": ["Aomi Container Terminal", "Oi Container Terminal", "Shinagawa Container Terminal", "Takeshiba Passenger Terminal"],
  "Port of Yokohama": ["Honmoku Container Terminal", "Minami Honmoku Container Terminal", "Yamashita Pier", "Osanbashi Pier"],
  "Port of Nagoya": ["Garden Pier", "Kinjo Pier", "Nagoya Container Terminal", "Nagoya Port International Passenger Terminal"],
  "Port of Osaka": ["Osaka Port International Ferry Terminal", "Cosmo Pier", "Nanko Container Terminal", "Tempozan Passenger Terminal"],
  "Port of Kobe": ["Kobe Container Terminal", "Port Island", "Rokko Island", "Kobe Port International Passenger Terminal"],
  "Port of Chiba": ["Chiba Container Terminal", "Chiba Port Park", "Chiba International Passenger Terminal"],
  "Port of Kitakyushu": ["Mojiko Retro", "Tobata Container Terminal", "Wakamatsu Container Terminal"],
  "Port of Hakata": ["Hakata Port International Terminal", "Bayside Place", "Marinoa City Fukuoka"],
  "Port of Shimizu": ["Shimizu Container Terminal", "Shimizu Port Cruise Terminal"],
  "Port of Sendai": ["Sendai Port Container Terminal", "Sendai Port Passenger Terminal"],
  
  // Japan - Rail
  "Tokyo Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20"],
  "Shinjuku Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Osaka Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Nagoya Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Kyoto Station": ["Platform 0", "Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24", "Platform 25", "Platform 26", "Platform 27", "Platform 28", "Platform 29", "Platform 30"],
  "Shin-Osaka Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24"],
  "Yokohama Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Sapporo Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Fukuoka Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Kobe Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  
  // Japan - Air
  "Narita Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Haneda Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "International Terminal"],
  "Kansai Airport": ["Terminal 1", "Terminal 2"],
  "Chubu Centrair": ["Terminal 1", "Terminal 2"],
  "Fukuoka Airport": ["Domestic Terminal", "International Terminal"],
  "New Chitose Airport": ["Domestic Terminal", "International Terminal"],
  "Naha Airport": ["Domestic Terminal", "International Terminal", "LCC Terminal"],
  "Kagoshima Airport": ["Domestic Terminal", "International Terminal"],
  "Hiroshima Airport": ["Main Terminal"],
  "Sendai Airport": ["Main Terminal"],
  
  // Japan - Road
  "Tomei Expressway Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "Meishin Expressway Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  "Tohoku Expressway Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E"],
  "Kanetsu Expressway Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4"],
  "Chuo Expressway Hub": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Sanyo Expressway Hub": ["Dock A", "Dock B", "Dock C", "Dock D"],
  "Hokkaido Expressway Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
  "Kyushu Expressway Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4"],
  "Higashi-Kanto Expressway Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5"],
  "Nagoya Expressway Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // Japan - Custom
  "Customs - Tokyo": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4"],
  "Customs - Osaka": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Nagoya": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3"],
  "Customs - Yokohama": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3", "Inspection Bay 4"],
  "Customs - Kobe": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Narita": ["Processing Area 1", "Processing Area 2", "Processing Area 3"],
  "Customs - Haneda": ["Checkpoint A", "Checkpoint B", "Checkpoint C"],
  "Customs - Fukuoka": ["Inspection Zone 1", "Inspection Zone 2", "Inspection Zone 3"],
  "Customs - Chiba": ["Clearance Area 1", "Clearance Area 2"],
  "Customs - Kyoto": ["Inspection Bay 1", "Inspection Bay 2"],
  
  // Netherlands - Marine
  "Port of Rotterdam": ["ECT Delta Terminal", "ECT Euromax Terminal", "APM Terminals Rotterdam", "RWG Terminal", "Maasvlakte 2"],
  "Port of Amsterdam": ["Amsterdam Container Terminal", "ACT Terminal", "Mercurius Harbor", "Houtrak Terminal"],
  "Port of Vlissingen": ["Vlissingen Container Terminal", "Vlissingen Port", "Verbrugge Terminals"],
  "Port of Moerdijk": ["Moerdijk Container Terminal", "Moerdijk Port"],
  "Port of Terneuzen": ["Terneuzen Port", "Ghent-Terneuzen Canal Terminal"],
  "Port of IJmuiden": ["IJmuiden Port", "Beverwijk Terminal"],
  "Port of Delfzijl": ["Delfzijl Port", "Eemshaven Terminal"],
  "Port of Harlingen": ["Harlingen Port", "Harlingen Container Terminal"],
  "Port of Den Helder": ["Den Helder Port", "Naval Base"],
  "Port of Scheveningen": ["Scheveningen Harbor", "Scheveningen Fish Harbor"],
  
  // Netherlands - Rail
  "Amsterdam Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15"],
  "Rotterdam Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15"],
  "Utrecht Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21"],
  "The Hague Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
  "Eindhoven Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
  "Groningen": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11"],
  "Maastricht": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6"],
  "Leiden Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6"],
  "Arnhem Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Breda": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7"],
  
  // Netherlands - Air
  "Amsterdam Schiphol": ["Departure Hall 1", "Departure Hall 2", "Departure Hall 3", "Departure Hall 4"],
  "Rotterdam The Hague Airport": ["Main Terminal"],
  "Eindhoven Airport": ["Main Terminal"],
  "Maastricht Aachen Airport": ["Main Terminal"],
  "Groningen Airport": ["Main Terminal"],
  "Amsterdam Lelystad Airport": ["Main Terminal"],
  "Rotterdam Airport": ["Main Terminal"],
  
  // Netherlands - Road
  "A4 Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5"],
  "A2 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6"],
  "A1 Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "A12 Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4"],
  "A16 Hub": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "A15 Hub": ["Dock A", "Dock B", "Dock C", "Dock D"],
  "A6 Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "A7 Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5"],
  "A8 Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4"],
  "A9 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // Netherlands - Custom
  "Customs - Rotterdam": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - Schiphol": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Amsterdam": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3"],
  "Customs - Vlissingen": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  "Customs - Moerdijk": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Terneuzen": ["Processing Area 1", "Processing Area 2"],
  "Customs - Eindhoven": ["Checkpoint A", "Checkpoint B"],
  "Customs - The Hague": ["Inspection Zone 1", "Inspection Zone 2"],
  "Customs - Utrecht": ["Clearance Area 1", "Clearance Area 2"],
  "Customs - Groningen": ["Inspection Bay 1", "Inspection Bay 2"],
  
  // India - Marine
  "Jawaharlal Nehru Port": ["JNPT Container Terminal", "NSICT Terminal", "NSIGT Terminal", "BMCT Terminal", "NSFT Terminal"],
  "Mundra Port": ["Mundra Container Terminal", "Mundra International Container Terminal", "Mundra Adani Container Terminal", "Mundra Liquid Terminal"],
  "Chennai Port": ["Chennai Container Terminal", "Chennai International Container Terminal", "Chennai Port Trust"],
  "Visakhapatnam Port": ["Visakha Container Terminal", "Visakhapatnam Port Trust", "Gangavaram Port"],
  "Kolkata Port": ["Kolkata Dock System", "Haldia Dock Complex", "Kolkata Container Terminal"],
  "Port of Mumbai": ["Mumbai Port Trust", "Indira Dock", "Victoria Dock", "Prince's Dock"],
  "Cochin Port": ["Cochin Container Terminal", "International Container Transshipment Terminal", "Cochin Port Trust"],
  "Tuticorin Port": ["V.O. Chidambaranar Port", "Tuticorin Container Terminal"],
  "Paradip Port": ["Paradip Port Trust", "Paradip Container Terminal", "Paradip International Cargo Terminal"],
  "Hazira Port": ["Hazira Port", "Hazira Container Terminal", "Shell Hazira Terminal"],
  
  // India - Rail
  "Chhatrapati Shivaji Maharaj Terminus": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18"],
  "New Delhi Railway Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Howrah Junction": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23"],
  "Chennai Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Sealdah Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21"],
  "Mumbai Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
  "Bangalore City": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Secunderabad Junction": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Ahmedabad Junction": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Pune Junction": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6"],
  
  // India - Air
  "Indira Gandhi Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Mumbai Airport": ["Terminal 1", "Terminal 2"],
  "Bangalore Airport": ["Terminal 1", "Terminal 2"],
  "Chennai Airport": ["Domestic Terminal", "International Terminal"],
  "Kolkata Airport": ["Domestic Terminal", "International Terminal"],
  "Hyderabad Airport": ["Main Terminal"],
  "Cochin Airport": ["Domestic Terminal", "International Terminal"],
  "Ahmedabad Airport": ["Terminal 1", "Terminal 2"],
  "Pune Airport": ["Terminal 1"],
  "Goa Airport": ["Terminal 1", "Terminal 2"],
  
  // India - Road
  "Golden Quadrilateral - Delhi Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "NH44 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  "NH48 Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E"],
  "NH19 Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4"],
  "NH27 Hub": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "NH16 Hub": ["Dock A", "Dock B", "Dock C", "Dock D"],
  "NH52 Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
  "NH30 Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4"],
  "NH66 Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5"],
  "NH53 Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4"],
  
  // India - Custom
  "Customs - Mumbai": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - Delhi": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Chennai": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4"],
  "Customs - Kolkata": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  "Customs - Bangalore": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Hyderabad": ["Processing Area 1", "Processing Area 2"],
  "Customs - Cochin": ["Checkpoint A", "Checkpoint B"],
  "Customs - Ahmedabad": ["Inspection Zone 1", "Inspection Zone 2"],
  "Customs - Visakhapatnam": ["Clearance Area 1", "Clearance Area 2"],
  "Customs - Tuticorin": ["Inspection Bay 1", "Inspection Bay 2"],
  
  // UAE - Marine
  "Port of Jebel Ali": ["Jebel Ali Container Terminal 1", "Jebel Ali Container Terminal 2", "Jebel Ali Container Terminal 3", "Jebel Ali Free Zone Terminal"],
  "Port Khalifa": ["Khalifa Port Container Terminal", "Khalifa Port General Cargo Terminal", "Khalifa Port Auto Terminal"],
  "Port of Fujairah": ["Fujairah Container Terminal", "Fujairah Oil Terminal", "Fujairah Port"],
  "Port Rashid": ["Rashid Port Container Terminal", "Rashid Port Cruise Terminal", "Rashid Port General Cargo"],
  "Port of Zayed": ["Zayed Port Container Terminal", "Zayed Port General Cargo Terminal"],
  "Port of Hamriyah": ["Hamriyah Port", "Hamriyah Free Zone Terminal"],
  "Port of Sharjah": ["Hamriyah Port Sharjah", "Khor Fakkan Container Terminal"],
  "Port of Ras Al Khaimah": ["Saqr Port", "Ras Al Khaimah Port"],
  "Port of Ajman": ["Ajman Port", "Ajman Free Zone Terminal"],
  "Port of Umm Al Quwain": ["Umm Al Quwain Port", "Umm Al Quwain Free Trade Zone"],
  
  // UAE - Rail
  "Dubai Metro Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  "Abu Dhabi Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"],
  "Etihad Rail Freight Terminal": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4"],
  "Dubai Logistics Corridor": ["Zone A", "Zone B", "Zone C", "Zone D"],
  "Khalifa Port Rail Terminal": ["Platform 1", "Platform 2", "Platform 3"],
  "Jebel Ali Rail Terminal": ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  "Al Ghail Rail Terminal": ["Loading Zone 1", "Loading Zone 2"],
  "Fujairah Rail Terminal": ["Platform 1", "Platform 2"],
  "Sharjah Rail Terminal": ["Platform 1", "Platform 2", "Platform 3"],
  "Ruwais Rail Terminal": ["Platform 1", "Platform 2"],
  
  // UAE - Air
  "Dubai International": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Concourse A", "Concourse B", "Concourse C"],
  "Abu Dhabi International": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4", "Terminal 5"],
  "Sharjah Airport": ["Terminal 1", "Terminal 2", "Cargo Terminal"],
  "Al Maktoum Airport": ["Passenger Terminal", "Cargo Terminal", "Executive Terminal"],
  "Ras Al Khaimah Airport": ["Main Terminal"],
  "Fujairah Airport": ["Main Terminal"],
  "Al Ain Airport": ["Main Terminal"],
  "Dubai World Central": ["Passenger Terminal", "Cargo Terminal"],
  "Abu Dhabi Al Bateen": ["Executive Terminal"],
  "Sharjah Cargo Terminal": ["Cargo Terminal 1", "Cargo Terminal 2"],
  
  // UAE - Road
  "E11 Sheikh Zayed Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "E311 Dubai Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5", "Dock 6", "Dock 7", "Dock 8"],
  "E611 Emirates Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "E84 Sharjah Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4"],
  "E22 Al Ain Hub": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "E66 Dubai-Al Ain Hub": ["Dock A", "Dock B", "Dock C", "Dock D"],
  "E55 Zayed Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "E10 Abu Dhabi Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5"],
  "E20 Al Dhafra Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4"],
  "E90 Fujairah Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // UAE - Custom
  "Customs - Jebel Ali": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - Dubai Airport": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Abu Dhabi": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4"],
  "Customs - Sharjah": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  "Customs - Ras Al Khaimah": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Fujairah": ["Processing Area 1", "Processing Area 2"],
  "Customs - Al Ain": ["Checkpoint A", "Checkpoint B"],
  "Customs - Ajman": ["Inspection Zone 1", "Inspection Zone 2"],
  "Customs - Umm Al Quwain": ["Clearance Area 1"],
  "Customs - Dubai Free Zone": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  
  // Australia - Marine
  "Port of Melbourne": ["Swanson Dock East", "Swanson Dock West", "Appleton Dock", "Webb Dock", "Victoria Dock"],
  "Port Botany Sydney": ["Port Botany Container Terminal", "Port Botany Bulk Terminal", "Port Botany Liquid Terminal"],
  "Port of Brisbane": ["Fisherman Islands", "Port of Brisbane Container Terminal", "Port of Brisbane Auto Terminal"],
  "Port of Fremantle": ["North Quay", "Victoria Quay", "Fremantle Inner Harbour", "Kwinana Outer Harbour"],
  "Port of Adelaide": ["Outer Harbor", "Inner Harbor", "Port Adelaide Container Terminal"],
  "Port of Newcastle": ["Mayfield", "Carrington", "Kooragang", "Fern Bay"],
  "Port of Gladstone": ["Barney Point", "Clinton Coal Facility", "RG Tanna Coal Terminal", "Queensland Alumina Limited"],
  "Port of Townsville": ["Townsville Container Terminal", "Townsville Port", "Berth 10"],
  "Port of Darwin": ["East Arm Wharf", "Fort Hill Wharf", "Stokes Hill Wharf"],
  "Port of Hobart": ["Macquarie Wharf", "Sullivans Cove", "Hobart Cruise Terminal"],
  
    // Australia - Rail
  "Sydney Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24", "Platform 25"],
  "Melbourne Southern Cross": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16"],
  "Brisbane Central": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12"],
  "Perth Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9"],
  "Adelaide Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9"],
  "Central Station Sydney": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14", "Platform 15", "Platform 16", "Platform 17", "Platform 18", "Platform 19", "Platform 20", "Platform 21", "Platform 22", "Platform 23", "Platform 24", "Platform 25"],
  "Flinders Street Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10", "Platform 11", "Platform 12", "Platform 13", "Platform 14"],
  "Roma Street Station": ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5", "Platform 6", "Platform 7", "Platform 8", "Platform 9", "Platform 10"],
  "Parliament Station Melbourne": ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  
  // Australia - Air
  "Sydney Airport": ["Terminal 1", "Terminal 2", "Terminal 3"],
  "Melbourne Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "Brisbane Airport": ["Domestic Terminal", "International Terminal"],
  "Perth Airport": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "Adelaide Airport": ["Terminal 1"],
  "Gold Coast Airport": ["Main Terminal"],
  "Cairns Airport": ["Terminal 1", "Terminal 2"],
  "Canberra Airport": ["Main Terminal"],
  "Hobart Airport": ["Main Terminal"],
  "Darwin International": ["Main Terminal"],
  
  // Australia - Road
  "M1 Pacific Motorway Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5", "Loading Bay 6"],
  "M2 Sydney Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  "M7 Motorway Hub": ["Bay A", "Bay B", "Bay C", "Bay D", "Bay E", "Bay F"],
  "Hume Highway Hub": ["Loading Zone 1", "Loading Zone 2", "Loading Zone 3", "Loading Zone 4", "Loading Zone 5"],
  "Princes Highway Hub": ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"],
  "Stuart Highway Hub": ["Dock A", "Dock B", "Dock C", "Dock D"],
  "Great Western Highway Hub": ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
  "Pacific Highway Hub": ["Loading Bay 1", "Loading Bay 2", "Loading Bay 3", "Loading Bay 4", "Loading Bay 5"],
  "Newell Highway Hub": ["Bay 1", "Bay 2", "Bay 3", "Bay 4"],
  "Mitchell Highway Hub": ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"],
  
  // Australia - Custom
  "Customs - Sydney": ["Inspection Area 1", "Inspection Area 2", "Inspection Area 3", "Inspection Area 4", "Inspection Area 5"],
  "Customs - Melbourne": ["Processing Zone A", "Processing Zone B", "Processing Zone C", "Processing Zone D"],
  "Customs - Brisbane": ["Checkpoint 1", "Checkpoint 2", "Checkpoint 3", "Checkpoint 4"],
  "Customs - Perth": ["Inspection Bay 1", "Inspection Bay 2", "Inspection Bay 3"],
  "Customs - Adelaide": ["Zone 1", "Zone 2", "Zone 3"],
  "Customs - Darwin": ["Processing Area 1", "Processing Area 2"],
  "Customs - Fremantle": ["Checkpoint A", "Checkpoint B"],
  "Customs - Cairns": ["Inspection Zone 1", "Inspection Zone 2"],
  "Customs - Gold Coast": ["Clearance Area 1", "Clearance Area 2"],
  "Customs - Hobart": ["Inspection Bay 1", "Inspection Bay 2"],
}
export const TRANSPORT_DATA = {
  "United States": {
    Marine: ["Port of Los Angeles", "Port of Long Beach", "Port of New York/New Jersey", "Port of Savannah", "Port of Houston", "Port of Seattle", "Port of Oakland", "Port of Charleston", "Port of Virginia", "Port of Miami"],
    Rail: ["Grand Central Terminal", "Union Station Chicago", "Penn Station NY", "South Station Boston", "Union Station Washington DC", "30th Street Station Philadelphia", "Los Angeles Union Station", "Denver Union Station", "King Street Station Seattle", "San Francisco 4th and King"],
    Air: ["JFK Airport", "LAX Airport", "O'Hare Airport", "Atlanta Airport", "Dallas/Fort Worth", "Denver International", "San Francisco International", "Miami International", "Seattle-Tacoma International", "Newark Liberty International"],
    Road: ["Interstate 95 Hub", "Interstate 10 Hub", "Route 66 Station", "Chicago Logistics Hub", "Memphis Distribution Center", "Atlanta Freight Hub", "Dallas Logistics Hub", "Los Angeles Freight Terminal", "Portland Distribution Hub", "Phoenix Logistics Center"],
    Custom: ["Customs - Los Angeles", "Customs - New York", "Customs - Miami", "Customs - Chicago", "Customs - Houston", "Customs - Seattle", "Customs - San Francisco", "Customs - Atlanta", "Customs - Newark", "Customs - Detroit"]
  },
  "United Kingdom": {
    Marine: ["Port of Felixstowe", "Port of Southampton", "Port of London", "Port of Liverpool", "Port of Immingham", "Port of Dover", "Port of Grimsby", "Port of Tilbury", "Port of Belfast", "Port of Aberdeen"],
    Rail: ["London King's Cross", "London Paddington", "London Waterloo", "London Victoria", "London Euston", "London Liverpool Street", "Birmingham New Street", "Manchester Piccadilly", "Edinburgh Waverley", "Glasgow Central"],
    Air: ["Heathrow Airport", "Gatwick Airport", "Manchester Airport", "Birmingham Airport", "Stansted Airport", "Luton Airport", "Edinburgh Airport", "Glasgow Airport", "Bristol Airport", "Newcastle Airport"],
    Road: ["M1 Hub", "M25 Hub", "A1 Station", "M6 Logistics Hub", "M4 Freight Terminal", "M62 Distribution Center", "M5 Logistics Park", "A14 Freight Hub", "M40 Logistics Hub", "M8 Distribution Center"],
    Custom: ["Customs - Dover", "Customs - Heathrow", "Customs - Southampton", "Customs - Felixstowe", "Customs - London Gateway", "Customs - Manchester", "Customs - Birmingham", "Customs - Liverpool", "Customs - Tilbury", "Customs - Immingham"]
  },
  "China": {
    Marine: ["Port of Shanghai", "Port of Shenzhen", "Port of Ningbo-Zhoushan", "Port of Guangzhou", "Port of Qingdao", "Port of Tianjin", "Port of Dalian", "Port of Xiamen", "Port of Hong Kong", "Port of Lianyungang"],
    Rail: ["Beijing Railway Station", "Shanghai Hongqiao", "Guangzhou South", "Shenzhen North", "Beijing South", "Shanghai Railway Station", "Xi'an North", "Wuhan", "Chengdu East", "Nanjing South"],
    Air: ["Beijing Capital Airport", "Shanghai Pudong", "Guangzhou Baiyun", "Shenzhen Bao'an", "Beijing Daxing", "Shanghai Hongqiao Air", "Chengdu Tianfu", "Chengdu Shuangliu", "Xi'an Xianyang", "Hangzhou Xiaoshan"],
    Road: ["G1 Beijing Hub", "G15 Shanghai Hub", "G4 Guangzhou Hub", "G2 Beijing-Shanghai Hub", "G15 Shenyang-Haikou Hub", "G45 Daqing-Guangzhou Hub", "G6 Beijing-Lhasa Hub", "G30 Lianyungang-Khorgas Hub", "G5 Beijing-Kunming Hub", "G42 Shanghai-Chengdu Hub"],
    Custom: ["Customs - Shanghai", "Customs - Shenzhen", "Customs - Beijing", "Customs - Guangzhou", "Customs - Tianjin", "Customs - Ningbo", "Customs - Qingdao", "Customs - Xiamen", "Customs - Dalian", "Customs - Hong Kong"]
  },
  "Singapore": {
    Marine: ["Port of Singapore", "Jurong Port", "Pasir Panjang Terminal", "Tuas Port", "Port of Singapore", "Jurong Port", "Pasir Panjang Terminal", "Tuas Port", "Port of Singapore", "Jurong Port"],
    Rail: ["Woodlands Train Checkpoint", "Tanjong Pagar Station", "Jurong East MRT", "Raffles Place MRT", "Woodlands Train Checkpoint", "Tanjong Pagar Station", "Jurong East MRT", "Raffles Place MRT", "Woodlands Train Checkpoint", "Tanjong Pagar Station"],
    Air: ["Changi Airport", "Seletar Airport", "Changi Airport", "Seletar Airport", "Changi Airport", "Seletar Airport", "Changi Airport", "Seletar Airport", "Changi Airport", "Seletar Airport"],
    Road: ["Tuas Checkpoint", "Woodlands Checkpoint", "Changi Freight Hub", "Jurong Logistics Hub", "Pioneer Distribution Center", "Tuas Checkpoint", "Woodlands Checkpoint", "Changi Freight Hub", "Jurong Logistics Hub", "Pioneer Distribution Center"],
    Custom: ["Customs - Changi", "Customs - Tuas", "Customs - Woodlands", "Customs - Jurong", "Customs - Keppel", "Customs - Changi", "Customs - Tuas", "Customs - Woodlands", "Customs - Jurong", "Customs - Keppel"]
  },
  "Germany": {
    Marine: ["Port of Hamburg", "Port of Bremerhaven", "Port of Wilhelmshaven", "Port of Lübeck", "Port of Rostock", "Port of Kiel", "Port of Emden", "Port of Brunsbüttel", "Port of Cuxhaven", "Port of Sassnitz"],
    Rail: ["Berlin Hauptbahnhof", "Frankfurt Central", "Munich Central", "Hamburg Central", "Cologne Central", "Stuttgart Central", "Düsseldorf Central", "Leipzig Central", "Nuremberg Central", "Dresden Central"],
    Air: ["Frankfurt Airport", "Munich Airport", "Berlin Brandenburg", "Düsseldorf Airport", "Hamburg Airport", "Cologne Bonn Airport", "Stuttgart Airport", "Hannover Airport", "Nuremberg Airport", "Leipzig/Halle Airport"],
    Road: ["A1 Autobahn Hub", "A3 Frankfurt Hub", "A8 Munich Hub", "A2 Dortmund Hub", "A5 Frankfurt Hub", "A7 Hamburg Hub", "A9 Nuremberg Hub", "A4 Cologne Hub", "A10 Berlin Hub", "A6 Mannheim Hub"],
    Custom: ["Customs - Hamburg", "Customs - Frankfurt", "Customs - Munich", "Customs - Bremerhaven", "Customs - Düsseldorf", "Customs - Stuttgart", "Customs - Cologne", "Customs - Berlin", "Customs - Leipzig", "Customs - Nuremberg"]
  },
  "Japan": {
    Marine: ["Port of Tokyo", "Port of Yokohama", "Port of Nagoya", "Port of Osaka", "Port of Kobe", "Port of Chiba", "Port of Kitakyushu", "Port of Hakata", "Port of Shimizu", "Port of Sendai"],
    Rail: ["Tokyo Station", "Shinjuku Station", "Osaka Station", "Nagoya Station", "Kyoto Station", "Shin-Osaka Station", "Yokohama Station", "Sapporo Station", "Fukuoka Station", "Kobe Station"],
    Air: ["Narita Airport", "Haneda Airport", "Kansai Airport", "Chubu Centrair", "Fukuoka Airport", "New Chitose Airport", "Naha Airport", "Kagoshima Airport", "Hiroshima Airport", "Sendai Airport"],
    Road: ["Tomei Expressway Hub", "Meishin Expressway Hub", "Tohoku Expressway Hub", "Kanetsu Expressway Hub", "Chuo Expressway Hub", "Sanyo Expressway Hub", "Hokkaido Expressway Hub", "Kyushu Expressway Hub", "Higashi-Kanto Expressway Hub", "Nagoya Expressway Hub"],
    Custom: ["Customs - Tokyo", "Customs - Osaka", "Customs - Nagoya", "Customs - Yokohama", "Customs - Kobe", "Customs - Narita", "Customs - Haneda", "Customs - Fukuoka", "Customs - Chiba", "Customs - Kyoto"]
  },
  "Netherlands": {
    Marine: ["Port of Rotterdam", "Port of Amsterdam", "Port of Vlissingen", "Port of Moerdijk", "Port of Terneuzen", "Port of IJmuiden", "Port of Delfzijl", "Port of Harlingen", "Port of Den Helder", "Port of Scheveningen"],
    Rail: ["Amsterdam Central", "Rotterdam Central", "Utrecht Central", "The Hague Central", "Eindhoven Central", "Groningen", "Maastricht", "Leiden Central", "Arnhem Central", "Breda"],
    Air: ["Amsterdam Schiphol", "Rotterdam The Hague Airport", "Eindhoven Airport", "Maastricht Aachen Airport", "Groningen Airport", "Amsterdam Lelystad Airport", "Rotterdam Airport", "Amsterdam Schiphol", "Rotterdam The Hague Airport", "Eindhoven Airport"],
    Road: ["A4 Hub", "A2 Hub", "A1 Hub", "A12 Hub", "A16 Hub", "A15 Hub", "A6 Hub", "A7 Hub", "A8 Hub", "A9 Hub"],
    Custom: ["Customs - Rotterdam", "Customs - Schiphol", "Customs - Amsterdam", "Customs - Vlissingen", "Customs - Moerdijk", "Customs - Terneuzen", "Customs - Eindhoven", "Customs - The Hague", "Customs - Utrecht", "Customs - Groningen"]
  },
  "India": {
    Marine: ["Jawaharlal Nehru Port", "Mundra Port", "Chennai Port", "Visakhapatnam Port", "Kolkata Port", "Port of Mumbai", "Cochin Port", "Tuticorin Port", "Paradip Port", "Hazira Port"],
    Rail: ["Chhatrapati Shivaji Maharaj Terminus", "New Delhi Railway Station", "Howrah Junction", "Chennai Central", "Sealdah Station", "Mumbai Central", "Bangalore City", "Secunderabad Junction", "Ahmedabad Junction", "Pune Junction"],
    Air: ["Indira Gandhi Airport", "Mumbai Airport", "Bangalore Airport", "Chennai Airport", "Kolkata Airport", "Hyderabad Airport", "Cochin Airport", "Ahmedabad Airport", "Pune Airport", "Goa Airport"],
    Road: ["Golden Quadrilateral - Delhi Hub", "NH44 Hub", "NH48 Hub", "NH19 Hub", "NH27 Hub", "NH16 Hub", "NH52 Hub", "NH30 Hub", "NH66 Hub", "NH53 Hub"],
    Custom: ["Customs - Mumbai", "Customs - Delhi", "Customs - Chennai", "Customs - Kolkata", "Customs - Bangalore", "Customs - Hyderabad", "Customs - Cochin", "Customs - Ahmedabad", "Customs - Visakhapatnam", "Customs - Tuticorin"]
  },
  "UAE": {
    Marine: ["Port of Jebel Ali", "Port Khalifa", "Port of Fujairah", "Port Rashid", "Port of Zayed", "Port of Hamriyah", "Port of Sharjah", "Port of Ras Al Khaimah", "Port of Ajman", "Port of Umm Al Quwain"],
    Rail: ["Dubai Metro Central", "Abu Dhabi Central", "Etihad Rail Freight Terminal", "Dubai Logistics Corridor", "Khalifa Port Rail Terminal", "Jebel Ali Rail Terminal", "Al Ghail Rail Terminal", "Fujairah Rail Terminal", "Sharjah Rail Terminal", "Ruwais Rail Terminal"],
    Air: ["Dubai International", "Abu Dhabi International", "Sharjah Airport", "Al Maktoum Airport", "Ras Al Khaimah Airport", "Fujairah Airport", "Al Ain Airport", "Dubai World Central", "Abu Dhabi Al Bateen", "Sharjah Cargo Terminal"],
    Road: ["E11 Sheikh Zayed Hub", "E311 Dubai Hub", "E611 Emirates Hub", "E84 Sharjah Hub", "E22 Al Ain Hub", "E66 Dubai-Al Ain Hub", "E55 Zayed Hub", "E10 Abu Dhabi Hub", "E20 Al Dhafra Hub", "E90 Fujairah Hub"],
    Custom: ["Customs - Jebel Ali", "Customs - Dubai Airport", "Customs - Abu Dhabi", "Customs - Sharjah", "Customs - Ras Al Khaimah", "Customs - Fujairah", "Customs - Al Ain", "Customs - Ajman", "Customs - Umm Al Quwain", "Customs - Dubai Free Zone"]
  },
  "Australia": {
    Marine: ["Port of Melbourne", "Port Botany Sydney", "Port of Brisbane", "Port of Fremantle", "Port of Adelaide", "Port of Newcastle", "Port of Gladstone", "Port of Townsville", "Port of Darwin", "Port of Hobart"],
    Rail: ["Sydney Central", "Melbourne Southern Cross", "Brisbane Central", "Perth Station", "Adelaide Station", "Central Station Sydney", "Flinders Street Station", "Roma Street Station", "Parliament Station Melbourne", "Sydney Central"],
    Air: ["Sydney Airport", "Melbourne Airport", "Brisbane Airport", "Perth Airport", "Adelaide Airport", "Gold Coast Airport", "Cairns Airport", "Canberra Airport", "Hobart Airport", "Darwin International"],
    Road: ["M1 Pacific Motorway Hub", "M2 Sydney Hub", "M7 Motorway Hub", "Hume Highway Hub", "Princes Highway Hub", "Stuart Highway Hub", "Great Western Highway Hub", "Pacific Highway Hub", "Newell Highway Hub", "Mitchell Highway Hub"],
    Custom: ["Customs - Sydney", "Customs - Melbourne", "Customs - Brisbane", "Customs - Perth", "Customs - Adelaide", "Customs - Darwin", "Customs - Fremantle", "Customs - Cairns", "Customs - Gold Coast", "Customs - Hobart"]
  }
};

export const COUNTRIES = Object.keys(TRANSPORT_DATA) as Array<keyof typeof TRANSPORT_DATA>;