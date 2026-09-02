const ASSETS = {
  Bitcoin:{provider:'binance',symbol:'BTCUSDT'},Ethereum:{provider:'binance',symbol:'ETHUSDT'},Tether:{provider:'binance',symbol:'USDCUSDT'},Solana:{provider:'binance',symbol:'SOLUSDT'},BNB:{provider:'binance',symbol:'BNBUSDT'},XRP:{provider:'binance',symbol:'XRPUSDT'},Cardano:{provider:'binance',symbol:'ADAUSDT'},Dogecoin:{provider:'binance',symbol:'DOGEUSDT'},Avalanche:{provider:'binance',symbol:'AVAXUSDT'},Chainlink:{provider:'binance',symbol:'LINKUSDT'},Polkadot:{provider:'binance',symbol:'DOTUSDT'},Polygon:{provider:'binance',symbol:'POLUSDT'},
  Apple:{provider:'yahoo',symbol:'AAPL'},NVIDIA:{provider:'yahoo',symbol:'NVDA'},Microsoft:{provider:'yahoo',symbol:'MSFT'},Amazon:{provider:'yahoo',symbol:'AMZN'},Alphabet:{provider:'yahoo',symbol:'GOOGL'},Meta:{provider:'yahoo',symbol:'META'},Tesla:{provider:'yahoo',symbol:'TSLA'},
  'S&P 500':{provider:'yahoo',symbol:'%5EGSPC'},'Nasdaq 100':{provider:'yahoo',symbol:'%5ENDX'},'Dow Jones':{provider:'yahoo',symbol:'%5EDJI'},'Russell 2000':{provider:'yahoo',symbol:'%5ERUT'},DAX:{provider:'yahoo',symbol:'%5EGDAXI'},'FTSE 100':{provider:'yahoo',symbol:'%5EFTSE'},'Nikkei 225':{provider:'yahoo',symbol:'%5EN225'},'IBEX 35':{provider:'yahoo',symbol:'%5EIBEX'},
  Gold:{provider:'yahoo',symbol:'GC=F'},Silver:{provider:'yahoo',symbol:'SI=F'},'WTI Oil':{provider:'yahoo',symbol:'CL=F'},'Brent Oil':{provider:'yahoo',symbol:'BZ=F'},'Natural Gas':{provider:'yahoo',symbol:'NG=F'},Copper:{provider:'yahoo',symbol:'HG=F'},Platinum:{provider:'yahoo',symbol:'PL=F'},Corn:{provider:'yahoo',symbol:'ZC=F'},
  'EUR/USD':{provider:'yahoo',symbol:'EURUSD=X'},'USD/DOP':{provider:'yahoo',symbol:'USDDOP=X'},'GBP/USD':{provider:'yahoo',symbol:'GBPUSD=X'},'USD/JPY':{provider:'yahoo',symbol:'JPY=X',invert:true},'USD/MXN':{provider:'yahoo',symbol:'MXN=X',invert:true},'USD/CAD':{provider:'yahoo',symbol:'CAD=X',invert:true},'AUD/USD':{provider:'yahoo',symbol:'AUDUSD=X'},'USD/CHF':{provider:'yahoo',symbol:'CHF=X',invert:true}
};

function invertPoints(points){return points.map(([ts,v])=>[ts,v?1/v:null]).filter(x=>Number.isFinite(x[1]));}
async function getPoints(name,period){
  const info=ASSETS[name]; if(!info) throw new Error('asset');
  if(info.provider==='binance'){
    const limit=period==='1Y'?365:period==='90D'?90:30;
    const interval=period==='1Y'?'1d':'1h';
    const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${info.symbol}&interval=${interval}&limit=${period==='1Y'?limit:Math.min(limit*24,1000)}`);
    if(!r.ok) throw new Error('provider');
    return (await r.json()).map(x=>[Number(x[0]),Number(x[4])]);
  }
  const range=period==='1Y'?'1y':period==='90D'?'3mo':'1mo';
  const interval=period==='1Y'?'1d':'1h';
  const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${info.symbol}?range=${range}&interval=${interval}&events=history`);
  if(!r.ok) throw new Error('provider');
  const j=await r.json(),res=j.chart?.result?.[0]; if(!res) throw new Error('empty');
  let pts=res.timestamp.map((ts,i)=>[ts*1000,res.indicators.quote[0].close[i]]).filter(x=>Number.isFinite(x[1]));
  if(info.invert) pts=invertPoints(pts);
  const max=period==='1Y'?365:period==='90D'?90*24:30*24;
  return pts.slice(-max);
}
async function quote(name){
  const pts=await getPoints(name,'30D'); if(!pts.length) throw new Error('empty');
  const last=pts.at(-1)[1],prev=pts.length>1?pts.at(-2)[1]:last;
  return {name,price:last,change:prev?((last-prev)/prev)*100:0,updated:pts.at(-1)[0],source:ASSETS[name].provider==='binance'?'Binance':'Yahoo Finance'};
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=120');
  try{
    const url=new URL(req.url,`https://${req.headers.host||'localhost'}`),name=url.searchParams.get('asset'),period=url.searchParams.get('period')||'30D';
    if(name){const pts=await getPoints(name,period);if(!pts.length)throw new Error('empty');const first=pts[0][1],last=pts.at(-1)[1];return res.status(200).json({name,points:pts,price:last,change:first?((last-first)/first)*100:0,updated:pts.at(-1)[0],source:ASSETS[name].provider==='binance'?'Binance':'Yahoo Finance'});}
    const out={}; await Promise.all(Object.keys(ASSETS).map(async n=>{try{out[n]=await quote(n)}catch(e){out[n]={name:n,error:true}}}));
    return res.status(200).json(out);
  }catch(e){return res.status(502).json({error:'Market data unavailable'});}
}
