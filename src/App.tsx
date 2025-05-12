import appLogo from '/logo.png';
import './App.css';

function App() {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <main>
      <div>
        <a href="#">
          <img src={appLogo} className="logo" alt="App logo" />
        </a>
      </div>
      <h1>Anki Advanced</h1>
      <a href={`${baseUrl}editor-poc.html`}>Advanced Card Editor (legacy)</a>
    </main>
  )
}

export default App;
