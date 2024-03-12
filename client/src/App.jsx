import {Routes,Route} from "react-router-dom"
import './App.css'
import IndexPage from "./pages/IndexPage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import Layout from "./Layout.jsx"

function App() {
  

  return (
    <Routes>
      <Route path="/" element={<Layout />} >

<Route index element={<IndexPage />} />
<Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
 
  )
}

export default App
