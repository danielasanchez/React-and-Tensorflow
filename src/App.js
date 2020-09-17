import React, { useState, useRef, useReducer} from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";
import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Table} from 'react-bootstrap';

const machine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "modelReady" } },
    modelReady: { on: { next: "imageReady" } },
    imageReady: { on: { next: "identifying" }, showImage: true },
    identifying: { on: { next: "complete" } },
    complete: { on: { next: "modelReady" }, showImage: true, showResults: true }
  }
};
const reducer = (state, action) => {
  console.log(state);
  console.log(action);
  return machine.states[state].on[action];
}; 

function App() {
  const [classificationResults, setResults] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const inputRef = useRef();
  
  const [state, dispatch] = useReducer(reducer, machine.initial);
  
  const next = () => dispatch("next");

  const reset = async () => {
    setResults([]);
    next();
  };

  const upload = () => inputRef.current.click();

  const loadModel = async () => {
    next();
    const model = await mobilenet.load();
    setModel(model);
    next();
  };
  const handleUpload = event => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      next();
    }
  };

  const identify = async () => {
    next();
    const classificationResults = await model.classify(imageRef.current);
    setResults(classificationResults);
    next();
  };

  const actionButton = {
    initial: { action: loadModel, text: "Load Model" },
    loadingModel: { text: "Loading Model..." },
    modelReady: { action: upload, text: "Upload Image" },
    imageReady: { action: identify, text: "Identify Breed" },
    identifying: { text: "Identifying..." },
    complete: { action: reset, text: "Reset" }
  };

  const { showImage=false, showResults=false } = machine.states[state];
  
  const formatResult=(b,index)=>(
    <tr key={index}>
      <td>{b.className}</td>
      <td>{`${(b.probability * 100).toFixed(2)}%`}</td>
    </tr>
  ); 
  

  const total = classificationResults.reduce((probabilityT,b)=>{return probabilityT+b.probability},0)

 
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Dog breed classifier</p>
      </header>
      <div className="div">

        <div style={{ width: '18rem' }}>
          { 
            showImage 
            && 
            <img className="img" 
               src={imageURL} 
               alt="upload-preview" 
               ref={imageRef} />
          }
          <input
            type="file"
            accept="image/*"
            capture="camera"
            ref={inputRef}
            onChange={handleUpload}
          />

          <Button variant="secondary" size="lg"  onClick={actionButton[state].action}>
            {actionButton[state].text}
          </Button>
        </div>
        <div style={{ width: '18rem' }}>
          {
            showResults && 
              <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Breed</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {
                  classificationResults.map((b,i)=>formatResult(b,i))
                }
              </tbody>
            </Table>
          }
          {
            (showResults && total < 0.5) && <h3>Your dog is unique</h3>
          }
        </div>
        
      </div>
    </div>
  );
}

export default App;
