import "./App.css";
import { memo, useCallback, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default memo(function App() {

  /////////////////////////////
  // STATE ////////////////////
  /////////////////////////////

  const {
    transcript,
    // listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [state, setState] = useState({
    pastUserInputs: [],
    generatedResponses: [],
    displayOutput: [],
    fetchedAnswer: false,
  });

  ///////////////////////////
  // FUNCTIONS //////////////
  ///////////////////////////

  // HANDLE START LISTENING
  const handleStartListening = useCallback(() => {
    setState((prevState) => {
      return {
        ...prevState,
        fetchedAnswer: false,
      };
    });

    SpeechRecognition.startListening();
  }, []);

  // HANDLE STOP LISTENING
  const handleStopListening = useCallback(async () => {
    try {
      // STOP MIC
      SpeechRecognition.stopListening();

      const requestBody = {
        inputs: {
          past_user_inputs: state.pastUserInputs,
          generated_responses: state.generatedResponses,
          text: transcript,
        }
      }

      // FETCH AI ANSWER
      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
        {
          headers: {
            Authorization: `Bearer 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`,
          },
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      // PARSE JSOn
      const result = await response.json();
        
      // SET NEW AI OUTPUT
      setState((prevState) => {
        return {
          ...prevState,
          pastUserInputs: [...state.pastUserInputs, transcript],
          generatedResponses: [...state.generatedResponses, result.generated_text],
          displayOutput: [...state.displayOutput,{text: transcript, isAI: false}, {text: result.generated_text, isAI: true}],
          fetchedAnswer: true,
        };
      });
    } catch (error) {
      console.log("Error fetching answer...", error);
    }

  }, [state.displayOutput, state.generatedResponses, state.pastUserInputs, transcript]);
  

  // HANDLE RESET AI OUTPUT + INPUT
  const handleReset = useCallback(() => {
    setState((prevState) => {
      return {
        ...prevState,
        pastUserInputs: [],
        generatedResponses: [],
        displayOutput: [],
      };
    });
    resetTranscript();
  }, [resetTranscript]);

  ///////////////////////////
  // RENDER /////////////////
  ///////////////////////////

  // IF BROWSER DOESN'T SUPPORT SPEECH RECOGNIZTION
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className="App">
      <div className="title">Click on the mic to start generating text</div>

      {/* MIC */}
      <button
        className="material-icons micIcon"
        onTouchStart={handleStartListening}
        onMouseDown={handleStartListening}
        onTouchEnd={handleStopListening}
        onMouseUp={handleStopListening}
      >
        mic
      </button>

      {/* OUTPUT BOX */}
      <div className="answerBox">
          
          {/* CLEAR BUTTON */}
          {!state.speaking && state.displayOutput.length > 0 && (
            <div className="material-icons clearBtn" onClick={handleReset}>close</div>
          )}

          {
            state.displayOutput.map((output, index) => {
              return (
                <div 
                  key={`output_${index}`}
                  className={`outputRow ${output.isAI ? "aiRow" : "userRow"}`}
                  style={{
                    marginTop: index === 0 ? "10px" : "",
                  }}
                >
                 <span style={{fontWeight: 'bold'}}>{output.isAI ? "AI: " : "You: "}</span>{output.text}
                </div>
              )
            })
          }

          {/* LIVE TRANSCRIPT */}
          {
            !state.fetchedAnswer &&
            <div className="liveInput">{transcript}</div>
          }
          
      </div>

    </div>
  );
});
