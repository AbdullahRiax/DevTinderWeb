import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './Components/Header.jsx'
import Login from './Components/Login.jsx'
import Feed from './Components/Feed.jsx'
import Profile from './Components/Profile.jsx'
import Connections from './Components/Connections.jsx'
import Requests from './Components/Requests.jsx'
import Chat from './Components/Chat.jsx'
import RealtimeSync from './Components/RealtimeSync.jsx'
import appStore from './utils/appStore.js'

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter>
        <RealtimeSync />
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
