import { useEffect, useState } from "react";
import { createRecognizer } from "./recognizer";
import twisters from './twisters.json'



import levenshtein from "fast-levenshtein"
import { useSearchParams } from "react-router-dom";


const nextTwisterID = ()=>Math.floor(Math.random()*twisters.length);

function App() {

  const [searchParams, setSearchParams] = useSearchParams();

  let twisterID = searchParams.get('id') !== undefined ? searchParams.get('id') :  nextTwisterID()

  let twister =  twisters[twisterID];
  

  const [active, setActive] = useState(false);
  
  const [speech, setSpeech] = useState({
    interim: "",
    chunks: []
  });


  const [recognizer] = useState(()=>createRecognizer());

  useEffect(()=>{

    recognizer.onEvent(
      ({result}) => {
        if (!result || result.text === "") {
          return;
        }
        //console.log(result);
        setSpeech(data => ({
          interim: "",
          chunks: [
            ...data.chunks,
            ...result.result
          ]
        }))
      },
  
    result => {
      // if (!result || result.result.partial == "") {
      //   return;
      // }
  
      // setSpeech(data => ({
      //   ...data,
      //   interim: result.result.partial,
      // }));
    });

  }, [recognizer, setSpeech])


  const cleanTwister = twister[0]
    .replace(/['.,!?&]/g, '')
    .toLocaleLowerCase()
    .trim();

  const wordCount = cleanTwister.split(' ').length;

  const recorded = 
    speech
      .chunks
      .slice(-wordCount)

   const recordedText = recorded.map(x=>x.word).join(' ');

  console.log({cleanTwister, recorded})

  const distance = levenshtein.get(
    cleanTwister, 
    recordedText
  );

  const completed = Math.floor(
    (Math.min(recorded.length, wordCount) / wordCount) * 100
  );

  const score = Math.ceil( (1.0 - distance/cleanTwister.length) * 100);

  return (
    <div className="App">
      <div style={{margin: 'auto', maxWidth: '900px'}}>


        <div style={{background: 'steelblue', fontSize:'2em'}}>
          {twister[0]}
        </div>

        <h1>Score: {score}% | Completed: {completed}%</h1>

        <div style={{display:'flex', gap: '1em'}}>
          <button onClick={async () => {
            setActive(active=>!active);

            if (!active) {
              recognizer.start();
            } else {
              recognizer.stop();
            }

          }}>{active ? "Stop" : "Start"}</button>

          <button onClick={ ()=>{
              setSearchParams({id:nextTwisterID()});
              setSpeech({
                interim: "",
                chunks: []
              });
          }}> Next Twister </button>
        </div>


        <p>{recorded.map( (x,i) => <span key={i} style={{opacity: x.conf}}> {x.word} </span> )}</p>


      </div>

    </div>
  );
}

export default App;
