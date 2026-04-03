import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';

export default function App() {
  return (
    <div className="flex h-full bg-gray-950 text-gray-100">
      <Sidebar />
      <ChatView />
    </div>
  );
}
