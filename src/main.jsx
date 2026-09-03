import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowUpRight, Bell, ChevronRight, Clock3, Globe2,
  Menu, Moon, Newspaper, Search, Sparkles, Sun, TrendingDown, TrendingUp, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import "./styles.css";

const initialExcuses = [
  { id:"traffic", name:"I was stuck in traffic", category:"Travel", price:84.21, change:18.4, popularity:91, volatility:62, color:"violet" },
  { id:"power", name:"There was a power cut", category:"Weather", price:48.60, change:42.1, popularity:78, volatility:81, color:"amber" },
  { id:"wifi", name:"My WiFi stopped working", category:"Technology", price:31.44, change:-14.2, popularity:94, volatility:45, color:"cyan" },
  { id:"overslept", name:"I overslept", category:"Social", price:19.21, change:-7.3, popularity:87, volatility:39, color:"rose" },
  { id:"forgot", name:"I forgot", category:"Academic", price:6.72, change:-31.8, popularity:99, volatility:74, color:"orange" },
  { id:"family", name:"Something came up at home", category:"Family", price:76.17, change:3.2, popularity:72, volatility:68, color:"emerald" },
  { id:"phone", name:"My phone died", category:"Technology", price:32.18, change:6.8, popularity:83, volatility:51, color:"blue" },
  { id:"something", name:"Something came up", category:"Social", price:62.44, change:12.7, popularity:88, volatility:73, color:"pink" },
  { id:"laptop", name:"My laptop crashed", category:"Technology", price:97.31, change:21.2, popularity:61, volatility:66, color:"indigo" },
  { id:"rain", name:"The rain was too heavy", category:"Weather", price:73.18, change:28.1, popularity:64, volatility:77, color:"sky" }
];

const events = [
  ["RAIN EVENT", "Power Cut +42%", "Weather systems are creating unusual demand.", "up"],
  ["MARKET ALERT", "Traffic +18%", "Morning congestion has increased activity.", "up"],
  ["CREDIBILITY CRISIS", "I Forgot −31%", "The market is visibly tired of this one.", "down"],
  ["TECH OUTAGE", "WiFi +11%", "A mysterious router incident has been reported.", "up"],
  ["MONDAY CONDITIONS", "Overslept +24%", "Analysts refuse to elaborate.", "up"]
];

const categories = ["All", "Academic", "Work", "Travel", "Technology", "Family", "Weather", "Social", "Ridiculous"];

function seededNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeHistory(base, seed) {
  return Array.from({length: 18}, (_, i) => {
    const wave = Math.sin(i * 0.72 + seed) * base * 0.06;
    const noise = (seededNoise(seed + i * 17) - 0.5) * base * 0.11;
    return { t: i, value: Math.max(0.02, +(base + wave + noise + (i-9) * base * 0.002).toFixed(2)) };
  });
}

const excuseSignals = [
  { category:"Travel", words:["traffic","bus","train","flight","cab","uber","road","route","driver","metro","bike","car","late"] },
  { category:"Technology", words:["wifi","wi-fi","internet","network","router","laptop","computer","phone","battery","charger","server","website","app","technical"] },
  { category:"Weather", words:["rain","raining","storm","flood","heat","weather","power cut","electricity","thunder","wind"] },
  { category:"Academic", words:["class","college","school","exam","assignment","professor","teacher","homework","deadline","lecture","lab","project"] },
  { category:"Work", words:["work","office","boss","meeting","client","email","coworker","shift","deadline","commute"] },
  { category:"Family", words:["family","mom","mum","mother","dad","father","parents","home","relative","grandma","grandfather","emergency"] },
  { category:"Social", words:["party","friend","friends","date","dinner","wedding","birthday","alarm","overslept","sleep","forgot","forget","busy","appointment"] },
];

const nonExcuseMessages = [
  "That is not an excuse. That is just a sentence wearing confidence.",
  "Market rejected this submission: insufficient excuses detected.",
  "No rate today. The Excuse Market requires at least one questionable reason.",
  "That sounds suspiciously like a fact. We only price excuses here.",
  "ERROR 404: excuse not found. Please add a reason, preferably a ridiculous one.",
  "The market has reviewed your statement and decided it is simply... true.",
  "Strong sentence. Terrible excuse. ₹0.00 market rate.",
  "Our analysts stared at this for 11 seconds. Still not an excuse."
];

function classifyExcuse(text) {
  const s = text.toLowerCase().trim();

  // Common real-world excuse/reason phrases. The market is intentionally
  // generous: a plausible reason is enough; it does not need to begin with "I".
  const excusePhrases = [
    "went for", "went to", "had to go", "had a", "have a", "there was",
    "because", "due to", "as a result", "couldn't", "could not", "can't",
    "cannot", "wasn't able", "was not able", "forgot", "overslept", "slept",
    "stuck", "delayed", "late", "running late", "got held up", "held up",
    "broke", "broken", "crashed", "stopped working", "not working",
    "power cut", "no electricity", "wifi", "wi-fi", "internet", "traffic",
    "rain", "raining", "flood", "emergency", "appointment", "doctor",
    "hospital", "marriage", "wedding", "funeral", "family function",
    "family event", "ceremony", "birthday", "party", "exam", "class",
    "college", "school", "assignment", "project", "meeting", "office",
    "work", "boss", "client", "bus", "train", "flight", "cab", "uber",
    "driver", "car", "bike", "phone", "battery", "charger", "alarm",
    "home", "house", "relative", "friend", "friends", "mom", "mum",
    "mother", "dad", "father", "parents", "grandma", "grandfather"
  ];

  const hasReasonPhrase = excusePhrases.some(p => s.includes(p));

  // Short natural-language reasons such as "went for marriage" should pass.
  // Statements that are just opinions/facts without a reason should not.
  const hasActionReason =
    /^(went|had|have|got|was|were|am|is|my|there|something|someone|the|a|an|due|because|sorry|i|we|they)\b/.test(s) ||
    /\b(for|because|due to|with|at|on|from)\b/.test(s);

  let best = null;
  for (const group of excuseSignals) {
    const hits = group.words.filter(w => s.includes(w)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { category: group.category, hits };
  }

  if (!hasReasonPhrase && !hasActionReason) return { isExcuse:false };

  // Generic "went for marriage", "had a function", etc. are still valid excuses.
  if (!best) return { isExcuse:true, category:"Social", strength:1 };

  return {
    isExcuse:true,
    category:best.category,
    strength:Math.min(4, Math.max(1, best.hits))
  };
}

function makeExcuseRate(text, classification) {
  const seed = text.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const ranges = {
    Academic:[7, 58],
    Work:[18, 86],
    Travel:[22, 112],
    Technology:[11, 74],
    Family:[24, 105],
    Weather:[15, 92],
    Social:[12, 82],
    Ridiculous:[3, 55]
  };
  const [low, high] = ranges[classification.category] || ranges.Ridiculous;
  const complexity = Math.min(1, classification.strength / 4);
  return +(low + seededNoise(seed + 31) * (high - low) + complexity * 14).toFixed(2);
}

function App() {
  const [excuses, setExcuses] = useState(initialExcuses);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialExcuses[0]);
  const [input, setInput] = useState("");
  const [news, setNews] = useState(events[0]);
  const [marketPulse, setMarketPulse] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [showRateReveal, setShowRateReveal] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("excuse-market-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("excuse-market-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketPulse(p => p + 1);
      setExcuses(prev => prev.map((e, i) => {
        const delta = ((Math.sin(Date.now()/18000 + i) * 0.35) + (seededNoise(marketPulse + i + 11) - .5) * .9);
        const price = Math.max(.02, +(e.price * (1 + delta / 100)).toFixed(2));
        const change = +(e.change + delta * .08).toFixed(1);
        return {...e, price, change};
      }));
    }, 2800);
    return () => clearInterval(timer);
  }, [marketPulse]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNews(events[Math.floor(Math.random() * events.length)]);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    return excuses.filter(e =>
      (category === "All" || e.category === category) &&
      e.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [excuses, category, query]);

  const current = excuses.find(e => e.id === selected.id) || selected;
  const history = useMemo(() => makeHistory(current.price, current.id.length * 7 + current.price), [current.id, current.price]);

  function revealRate(item, message) {
    setSelected(item);
    setShowRateReveal(true);
    setToast(message);
    window.setTimeout(() => {
      document.getElementById("rateReveal")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function checkRate() {
    const text = input.trim();
    if (!text) return;

    const classification = classifyExcuse(text);

    if (!classification.isExcuse) {
      setShowRateReveal(false);
      setInvalidMessage(nonExcuseMessages[Math.floor(Math.random() * nonExcuseMessages.length)]);
      setToast("Market rejected the submission.");
      return;
    }

    setInvalidMessage("");
    const lower = text.toLowerCase();
    const match = excuses.find(e =>
      lower.includes(e.name.toLowerCase().replace("i was ", "").replace("i ", ""))
    );

    if (match) {
      revealRate(match, "Market rate found.");
      return;
    }

    const seed = text.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    const newItem = {
      id: "custom-" + seed,
      name: text,
      category: classification.category,
      price: makeExcuseRate(text, classification),
      change: +((seededNoise(seed+8)-.5)*28).toFixed(1),
      popularity: Math.round(30 + seededNoise(seed+2)*68),
      volatility: Math.round(20 + seededNoise(seed+4)*78),
      color:"fuchsia"
    };
    setExcuses(prev => [newItem, ...prev.filter(x => x.id !== newItem.id)]);
    setCategory("All");
    revealRate(newItem, "Market rate calculated.");
  }

  function submitListing() {
    const text = window.prompt("Submit a new excuse to the marketplace:");
    if (!text?.trim()) return;

    const clean = text.trim();
    const classification = classifyExcuse(clean);
    setInput(clean);

    if (!classification.isExcuse) {
      setShowRateReveal(false);
      setInvalidMessage(nonExcuseMessages[Math.floor(Math.random() * nonExcuseMessages.length)]);
      setToast("Submission rejected.");
      return;
    }

    setInvalidMessage("");
    const seed = clean.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    const item = {
      id:"community-"+Date.now(),
      name:clean,
      category:classification.category,
      price:makeExcuseRate(clean, classification),
      change:+((seededNoise(seed+3)-.5)*24).toFixed(1),
      popularity:Math.round(20+seededNoise(seed+5)*70),
      volatility:Math.round(25+seededNoise(seed+9)*70),
      color:"fuchsia"
    };
    setExcuses(prev => [item, ...prev]);
    revealRate(item, "Listing added to the market.");
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(()=>setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const rising = [...excuses].sort((a,b)=>b.change-a.change).slice(0,4);
  const falling = [...excuses].sort((a,b)=>a.change-b.change).slice(0,4);

  return (
    <div className="app">
      <div className="noise" />
      <header className="topbar">
        <div className="brand" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
          <div className="brandMark"><span>₹</span></div>
          <div>
            <div className="brandName">EXCUSE MARKETPLACE</div>
            <div className="brandSub">EVERY EXCUSE HAS A MARKET RATE</div>
          </div>
        </div>
        <nav className="nav">
          <a href="#market">Market</a>
          <a href="#trending">Trending</a>
          <a href="#news">News</a>
          <button className="iconBtn" onClick={()=>setShowMenu(!showMenu)} aria-label="menu">
            {showMenu ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </nav>
        {showMenu && <div className="mobileMenu"><a href="#market">Market</a><a href="#trending">Trending</a><a href="#news">News</a></div>}
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="liveDot"/> LIVE MARKET · THURSDAY</div>
          <h1>What is your<br/><em>excuse worth?</em></h1>
          <p>Enter an excuse. We will assign it a completely unnecessary market rate.</p>

          <div className="searchBox">
            <Search size={20}/>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && checkRate()}
              placeholder="“I was stuck in traffic…”"
            />
            <button onClick={checkRate}>CHECK RATE <ChevronRight size={17}/></button>
          </div>

          <div className="heroStats">
            <span><strong>10,482</strong> excuses indexed</span>
            <span className="sep">·</span>
            <span><strong>₹84.21</strong> average rate</span>
            <span className="sep">·</span>
            <span><strong>0%</strong> practical value</span>
          </div>
        </section>

        <section className="ticker" id="news">
          <div className="tickerLabel"><Zap size={14}/> MARKET NEWS</div>
          <div className="tickerText"><b>{news[0]}</b> — {news[1]} <span>{news[2]}</span></div>
          <Clock3 size={15}/>
          <span className="updated">LIVE</span>
        </section>

        <section className="section" id="market">
          <div className="sectionHead">
            <div>
              <div className="kicker">01 / MARKET</div>
              <h2>Live excuse market</h2>
            </div>
            <button
              className="themeBtn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
              <span>{theme === "dark" ? "LIGHT" : "DARK"}</span>
            </button>
            <button className="submitBtn" onClick={submitListing}><Sparkles size={16}/> SUBMIT LISTING</button>
          </div>

          {invalidMessage && (
            <div className="invalidReveal">
              <div className="invalidIcon">₹0</div>
              <div className="invalidKicker">MARKET REJECTION</div>
              <h3>{invalidMessage}</h3>
              <p>Try something with a reason, a problem, or an absolutely questionable chain of events.</p>
              <button onClick={()=>{setInvalidMessage(""); setInput("");}}>
                TRY AN ACTUAL EXCUSE <ChevronRight size={16}/>
              </button>
            </div>
          )}

          {showRateReveal && (
            <div className="rateReveal" id="rateReveal">
              <div className="rateGlow" />
              <div className="rateRevealTop">
                <span className="rateKicker"><span className="liveDot"/> MARKET RATE DISCOVERED</span>
                <button className="rateClose" onClick={()=>setShowRateReveal(false)} aria-label="Close rate result"><X size={17}/></button>
              </div>
              <div className="rateRevealBody">
                <div className="rateExcuseLabel">THE MARKET VALUES THIS EXCUSE AT</div>
                <div className="revealPrice">₹{current.price.toFixed(2)}</div>
                <div className={current.change>=0 ? "revealChange up" : "revealChange down"}>
                  {current.change>=0 ? <TrendingUp size={21}/> : <TrendingDown size={21}/>}
                  {current.change>=0 ? "+" : ""}{current.change.toFixed(1)}% today
                </div>
                <div className="revealExcuse">“{current.name}”</div>
                <div className="revealDisclaimer">COMPLETELY FICTIONAL · ABSOLUTELY UNNECESSARY · ₹0 REAL VALUE</div>
              </div>
            </div>
          )}

          <div className="categoryBar">
            {categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}
            <div className="miniSearch"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search market"/></div>
          </div>

          <div className="marketGrid">
            <div className="tableCard">
              <div className="tableHeader"><span>EXCUSE</span><span>RATE</span><span>24H</span><span>DEMAND</span></div>
              {filtered.map((e, i)=>(
                <button className={"marketRow "+(current.id===e.id?"selected":"")} key={e.id} onClick={()=>setSelected(e)}>
                  <span className="excuseCell">
                    <span className={"miniIcon "+e.color}>{e.name.slice(0,1).toUpperCase()}</span>
                    <span><b>{e.name}</b><small>{e.category}</small></span>
                  </span>
                  <strong>₹{e.price.toFixed(2)}</strong>
                  <span className={e.change>=0?"up":"down"}>{e.change>=0?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {Math.abs(e.change).toFixed(1)}%</span>
                  <span className="demand"><i style={{width:`${e.popularity}%`}}/><small>{e.popularity}%</small></span>
                </button>
              ))}
            </div>

            <aside className="quoteCard">
              <div className="quoteTop"><span>MARKET RATE</span><span className="livePill"><span className="liveDot"/>LIVE</span></div>
              <div className="bigPrice">₹{current.price.toFixed(2)}</div>
              <div className={current.change>=0?"bigChange up":"bigChange down"}>
                {current.change>=0?<TrendingUp size={18}/>:<TrendingDown size={18}/>}
                {current.change>=0?"+":""}{current.change.toFixed(1)}% today
              </div>
              <div className="quoteName">{current.name}</div>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity=".35"/>
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" vertical={false}/>
                    <XAxis dataKey="t" hide/>
                    <YAxis hide domain={["dataMin - 10", "dataMax + 10"]}/>
                    <Tooltip contentStyle={{background:"#111113",border:"1px solid #303036",borderRadius:8}} formatter={(v)=>[`₹${v}`, "rate"]}/>
                    <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#priceFill)" isAnimationActive={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="quoteGrid">
                <div><small>7 DAY</small><b>+21.7%</b></div>
                <div><small>ALL-TIME HIGH</small><b>₹{(current.price*1.7).toFixed(2)}</b></div>
                <div><small>ALL-TIME LOW</small><b>₹{Math.max(.02,current.price*.07).toFixed(2)}</b></div>
                <div><small>VOLATILITY</small><b>{current.volatility}%</b></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="trending">
          <div className="sectionHead">
            <div><div className="kicker">02 / MOVEMENT</div><h2>Trending now</h2></div>
            <span className="sectionNote">Prices are fictional. The drama is real.</span>
          </div>
          <div className="trendGrid">
            <div className="trendCard">
              <div className="trendTitle"><TrendingUp size={17}/> RISING FASTEST</div>
              {rising.map(e=><div className="trendItem" key={e.id}><span>{e.name}</span><b>₹{e.price.toFixed(2)}</b><em className="up">+{e.change.toFixed(1)}%</em></div>)}
            </div>
            <div className="trendCard">
              <div className="trendTitle"><TrendingDown size={17}/> FALLING FASTEST</div>
              {falling.map(e=><div className="trendItem" key={e.id}><span>{e.name}</span><b>₹{e.price.toFixed(2)}</b><em className="down">{e.change.toFixed(1)}%</em></div>)}
            </div>
          </div>
        </section>

        <section className="section newsSection">
          <div className="sectionHead">
            <div><div className="kicker">03 / MARKET INTELLIGENCE</div><h2>Absolutely serious news</h2></div>
            <Newspaper size={20}/>
          </div>
          <div className="newsGrid">
            {events.map((n,i)=><article className="newsCard" key={i}>
              <div className="newsMeta"><span>MARKET NEWS</span><span>0{i+1} MIN AGO</span></div>
              <h3>{n[0]}</h3>
              <p>{n[1]}</p>
              <small>{n[2]}</small>
            </article>)}
          </div>
        </section>

        <section className="closing">
          <Globe2 size={22}/>
          <div>
            <div className="kicker">MARKET STATUS</div>
            <h2>The market remains completely unnecessary.</h2>
            <p>Millions of imaginary rupees are moving through a market nobody asked for.</p>
          </div>
          <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>CHECK ANOTHER RATE <ChevronRight size={17}/></button>
        </section>
      </main>

      <footer>
        <div>EXCUSE MARKETPLACE © 2026</div>
        <div>NOT FINANCIAL ADVICE · NOT USEFUL · VERY SERIOUS</div>
      </footer>

      {toast && <div className="toast"><Bell size={15}/>{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
