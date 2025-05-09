import appLogo from '/logo.png'
import './App.css'

function App() {
  return (
    <>
      <div>
        <a href="#">
          <img src={appLogo} className="logo" alt="App logo" />
        </a>
      </div>
      <h1>Anki Advanced</h1>
      <a href='./editor-poc.html'>Advanced Card Editor (legacy)</a>
    </>
  )
}

export default App;
