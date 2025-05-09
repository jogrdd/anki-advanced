import appLogo from '/logo.png';
import indexStyle from './index.css?inline';
import appStyle from './App.css?inline';
import { useHref } from 'react-router';

function App() {
  return (
    <main>
      <style>{indexStyle}</style>
      <style>{appStyle}</style>
      <div>
        <a href="#">
          <img src={appLogo} className="logo" alt="App logo" />
        </a>
      </div>
      <h1>Anki Advanced</h1>
      <a href={useHref('/editor-poc')}>Advanced Card Editor (legacy)</a>
    </main>
  )
}

export default App;
