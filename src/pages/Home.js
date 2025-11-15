import { useEffect, useState } from 'react';
import { IMAGES } from '../Images';
import '../App.css';

export default function Home() {


  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isPlay, setIsPlay] = useState(true);
  const [currentSold, setCurrentSold] = useState(null);
  const [lastSold, setLastSold] = useState(null);
  const [showRound1, setShowRound1] = useState(true);
  const [showRound2, setShowRound2] = useState(false);

  const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vS7fgCmHlAcPALtGEbrIjpjNPkcF8wLJlf4oeFIK2WKXEBNk6gNJFIjAWvf95Pdjw/pub?output=csv`;

  useEffect(() => {
    fetchSheetData();
  }, []);

  const fetchSheetData = async () => {
    try {
      // 🔥 add timestamp to force a fresh download each time
      const timestamp = new Date().getTime();
      // const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(csvUrl)}&t=${timestamp}`;


      const sheetId = "13rSTnsPpD3zRiBIMmIkiZsZZJloYy12MMMTjlUF2TeI";
      const apiKey = process.env.REACT_APP_API_KEY;
      const range = "Sheet1!A1:AV1000"; // ✅ Must include range
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

      const res = await fetch(url, { cache: "no-store" }); // ⛔ disable caching
      // const csvText = await res.text();

      // const parsed = Papa.parse(csvText, { header: false });
      // const rows = parsed.data.filter(r => r.some(c => c?.trim() !== ""));

      const json = await res.json();

      const rows = json?.values

      // 🔥 always create new data, don't merge with old
      const owners = [];
      const ownerBlockSize = 6;

      for (let colStart = 0; colStart < rows[0].length; colStart += ownerBlockSize) {
        const ownerName = rows[1][colStart]?.trim();
        const teamName = rows[1][colStart + 1]?.trim();
        if (!ownerName || !teamName) continue;

        const currentOwner = {
          Owner: ownerName,
          Team: teamName,
          Captain: null,
          Captain_Role: null,
          Rounds: []
        };

        let currentRound = null;

        for (let i = 2; i < rows.length; i++) {
          const row = rows[i].slice(colStart, colStart + ownerBlockSize).map(c => c?.trim());
          if (!row.some(c => c)) continue;
          const cellValue = row[0]?.toLowerCase();

          if (cellValue.includes("round")) {
            currentRound = { Round: row[0], Players: [] };
            currentOwner.Rounds.push(currentRound);
            continue;
          }

          if (!currentRound && !cellValue.includes("owner") && !cellValue.includes("team")) {
            currentOwner.Captain = row[1] == "#N/A" ? "" : row[1]?.split("|")[0];
            currentOwner.Captain_Role = row[1] == "#N/A" ? "" : row[1]?.split("|")[1];
            continue;
          }

          if (currentRound && !cellValue.includes("total") && !cellValue.includes("round")) {
            if (currentRound.Players.length >= 6) continue;
            const playerName = row[1] == "#N/A" ? "" : row[1]?.split("|")[0];
            const role = row[1] == "#N/A" ? "" : row[1]?.split("|")[1];
            const points = row[2] || "";
            const balance = row[3] || "";
            const available = row[4] || "";

            currentRound.Players.push({
              Player: playerName,
              Role: role,
              Points: points,
              Balance: balance,
              Available: available
            });
            continue;
          }

          if (currentRound && cellValue.includes("total")) {
            currentRound.Total = {
              Points: row[2] || "",
              Balance: row[3] || "",
              Available: row[4] || ""
            };
          }
        }

        owners.push(currentOwner);
      }

      // 🔄 replace previous data completely
      setData(owners);

      if (rows[27] != "#N/A" && rows[27][0] != "") { setCurrentSold({ image: rows[27][10], points: rows[27][1] || "", name: rows[27][3] || "", team: rows[27][2] || "", age: rows[27][4] || "", category: rows[27][5] || "", city: rows[27][6] || "", role: rows[27][7] || "", bat_style: rows[27][8] || "", ball_style: rows[27][8] || "", }) }
      if (rows[28] != "#N/A" && rows[28][0] != "") { setLastSold({ name: rows[28][3], team: rows[28][2], points: rows[28][1], }) }

      // console.log("sold", currentSold)

    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  useEffect(() => {
    if (isPlay == true) {
      setCurrentSold(null)
    }
  }, [isPlay])


  return (


    <div className="clsmain">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 order-2 order-lg-1 clsmaincol clsmaincol1">
            <div className="row">
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[0]?.Team}</h2>
                    <h4>{data[0]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[0]?.Captain}</b><span>(C)</span></p>
                      {data[0]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[0]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[0]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[0]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[0]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[0]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[0]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[1]?.Team}</h2>
                    <h4>{data[1]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[1]?.Captain}</b><span>(C)</span></p>
                              {data[1]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[1]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[1]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (
                      <div className="clsaucroundcol">
                        <div className="clsroundlabel bgcolor1">
                          <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                        </div>
                        {data[1]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                          <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                            <p>{item?.Player}</p>
                            {item?.Role?.trim() == "Bowler" ? (
                              <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                            ) : item?.Role?.trim() == "Batsmen" ? (
                              <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                            ) : item?.Role?.trim() == "All rounder" ? (
                              <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                            ) : <div style={{ height: 16 }}></div>}
                          </div>
                          <div className="clstbcol clstbcol2">
                            <p>{item?.Points}</p>
                          </div>
                        </div>))}
                      </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[1]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[1]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[1]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[2]?.Team}</h2>
                    <h4>{data[2]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[2]?.Captain}</b><span>(C)</span></p>
                              {data[2]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[2]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[2]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[2]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[2]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[2]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[2]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[3]?.Team}</h2>
                    <h4>{data[3]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[3]?.Captain}</b><span>(C)</span></p>
                              {data[3]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[3]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[3]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[3]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[3]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[3]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[3]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 order-1 order-lg-2 clsmaincol clsmaincol2">
            <div className="clspoweredby text-center">
              <p>Design & Developed by</p>
              <div className="clssoftlogo"><img src="/softnoesis-logo.svg" alt="" height={30} /></div>
            </div>
            <div className="clsscl text-center">
              <img src="/scl.svg" alt="" height={120} />
            </div>

            {(currentSold && isPlay == false) && (<div className="w-100 clssoldplayer text-center" style={{ marginTop: -10 }}>
              <div className="clsplayerphoto" style={{ width: 150, height: 150 }}>
                <img src={currentSold?.image ? `/Images/${IMAGES?.find(image => image.url == currentSold?.image)?.image}` : "https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352010-stock-illustration-default-placeholder-man-and-woman.jpg"} alt="" />
              </div>
              <div className="clssoldplayerinfo">
                <div className="clsplydetails" style={{ marginTop: -15 }}>
                  <h3>{currentSold?.name}</h3>
                  <div className="clssoltpointinfo" style={{ marginTop: -10 }}>
                    <div className="clssoltpoint">Sold Out To</div>
                    <h4>{currentSold?.team}</h4>
                    <p><span>{currentSold?.points}</span> Points</p>
                  </div>
                </div>
                <div className="clsplayalldetails">
                  <ul>
                    <li>
                      <p>Age</p>
                      <p><b>{currentSold?.age}</b></p>
                    </li>
                    <li>
                      <p>Category</p>
                      <p><b>{currentSold?.category}</b></p>
                    </li>
                    <li>
                      <p>City</p>
                      <p><b>{currentSold?.city}</b></p>
                    </li>
                    <li>
                      <p>Playing Role</p>
                      <p><b>{currentSold?.role}</b></p>
                    </li>
                    <li>
                      <p>Batting Style</p>
                      <p><b>{currentSold?.bat_style}</b></p>
                    </li>
                    <li>
                      <p>Bowling Style</p>
                      <p><b>{currentSold?.ball_style}</b></p>
                    </li>
                  </ul>
                </div>
                <div className="clssoldouticon"><img src="/sold-out-icon.svg" alt="" /></div>
              </div>
            </div>)}

            {(!currentSold || isPlay) && (<div className="w-100 clssoldplayer clsauctionlive text-center">
              <div className="clsplayerphoto flipanim1" style={{ width: 150, height: 150 }} >
                <img src="/default-icon.svg" alt="" />
              </div>
              <div className="clssoldplayerinfo">
                <div className="clsplydetails">
                  <h3>Karan Kachara</h3>
                  <div className="clssoltpointinfo">
                    <h4>Shreemali Smashers</h4>
                  </div>
                </div>
                <div className="clsplayalldetails">
                  <ul>
                    <li>
                      <p>Age</p>
                      <p><b>42</b></p>
                    </li>
                    <li>
                      <p>Category</p>
                      <p><b>Gnati Member</b></p>
                    </li>
                    <li>
                      <p>City</p>
                      <p><b>Surat</b></p>
                    </li>
                    <li>
                      <p>Playing Role</p>
                      <p><b>All Rounder</b></p>
                    </li>
                    <li>
                      <p>Batting Style</p>
                      <p><b>Right Handed</b></p>
                    </li>
                    <li>
                      <p>Bowling Style</p>
                      <p><b>Left Arm</b></p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>)}

            <div className="w-100 clsoptsbtn d-flex justify-content-center">

              {isPlay ? (<a className="clspause"
                onClick={
                  () => {
                    setIsPlay(false)
                    fetchSheetData()
                  }
                }
              ></a>) : (<a className="clsplay"
                onClick={
                  () => {
                    // fetchSheetData()
                    setIsPlay(true)
                  }
                }
              ></a>)}

              <a className="clsreload"
                onClick={() => {
                  fetchSheetData()
                }}></a>
              {/* <a className="clsback"></a> */}
            </div>

            {lastSold && (<div className="clslastsoldout">
              <div className="clsplydetails">
                <h5>Last Sold</h5>
                <h3>{lastSold?.name}</h3>
                <div className="clssoltpointinfo">
                  <h4>{lastSold?.team}</h4>
                  <p><span>{lastSold?.points}</span> Points</p>
                </div>
              </div>
            </div>)}

          </div>

          <div className="col-12 order-3 clsmaincol clsmaincol3">
            <div className="row">
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[4]?.Team}</h2>
                    <h4>{data[4]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[4]?.Captain}</b><span>(C)</span></p>
                              {data[4]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[4]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[4]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[4]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[4]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[4]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[4]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[5]?.Team}</h2>
                    <h4>{data[5]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[5]?.Captain}</b><span>(C)</span></p>
                              {data[5]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[5]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[5]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[5]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[5]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[5]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[5]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[6]?.Team}</h2>
                    <h4>{data[6]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[6]?.Captain}</b><span>(C)</span></p>
                              {data[6]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[6]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[6]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[6]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[6]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[6]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[6]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
              <div className="col-12 col-lg-6 clsmaintable">
                <div className="w-100 clstablecol">
                  <div className="clstemaname text-center">
                    <h2>{data[7]?.Team}</h2>
                    <h4>{data[7]?.Owner}</h4>
                  </div>
                  <div className="clsplayertablehead d-flex text-white">
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p>Player Name</p>
                    </div>
                    <div className="clstbcol clstbcol2">
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="clscaptainname d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound1(prev => !prev)}>
                    {/* ICON */}
                    <span style={{
                      fontSize: "18px",
                      marginLeft: "3px",
                      fontWeight: "bold"
                    }}>
                      {showRound1 ? "−" : "+"}
                    </span>
                    <div className="clstbcol clstbcol1 flex-grow-1">
                      <p><b>{data[7]?.Captain}</b><span>(C)</span></p>
                              {data[7]?.Captain_Role?.trim() == "Bowler" ? (
                        <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                      ) : data[7]?.Captain_Role?.trim() == "Batsmen" ? (
                        <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                      ) : data[7]?.Captain_Role?.trim() == "All rounder" ? (
                        <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                      ) : <div style={{ height: 16 }}></div>}
                    </div>
                    <div className="clstbcol clstbcol2">&nbsp;</div>
                  </div>
                  <div className="clsroundcol">
                    {showRound1 && (<div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor1">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>1</span></p>
                      </div>
                      {data[7]?.Rounds[0]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>)}
                    <div className="clstotalrow d-flex" style={{ cursor: "pointer" }} onClick={() => setShowRound2(prev => !prev)}>
                      {/* ICON */}
                      <span style={{
                        fontSize: "18px",
                        marginLeft: "3px",
                        fontWeight: "bold"
                      }}>
                        {showRound2 ? "−" : "+"}
                      </span>
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[7]?.Rounds[0]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>
                  {showRound2 && (<div className="clsroundcol">
                    <div className="clsaucroundcol">
                      <div className="clsroundlabel bgcolor2">
                        <p>R&nbsp;O&nbsp;U&nbsp;N&nbsp;D&nbsp;<span>2</span></p>
                      </div>
                      {data[7]?.Rounds[1]?.Players?.map(item => (<div className="clsplayerlists d-flex">
                        <div className="clstbcol clstbcol1 d-flex justify-content-between flex-grow-1">
                          <p>{item?.Player}</p>
                          {item?.Role?.trim() == "Bowler" ? (
                            <div classNameName="clsplyicon"><img src="/boller-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "Batsmen" ? (
                            <div classNameName="clsplyicon"><img src="/bastman-icon.svg" height={16} alt="" /></div>
                          ) : item?.Role?.trim() == "All rounder" ? (
                            <div classNameName="clsplyicon"><img src="/all-rounder-icon.svg" height={16} alt="" /></div>
                          ) : <div style={{ height: 16 }}></div>}
                        </div>
                        <div className="clstbcol clstbcol2">
                          <p>{item?.Points}</p>
                        </div>
                      </div>))}
                    </div>
                    <div className="clstotalrow d-flex">
                      <div className="clstbcol clstbcol1 flex-grow-1">
                        <p>Total</p>
                      </div>
                      <div className="clstbcol clstbcol2">
                        <p>{data[7]?.Rounds[1]?.Total?.Points}</p>
                      </div>
                    </div>
                  </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}