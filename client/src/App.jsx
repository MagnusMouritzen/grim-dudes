import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import StatBlockList from './components/StatBlockList';
import StatBlockView from './components/StatBlockView';
import StatBlockEditor from './components/StatBlockEditor';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StatBlockList />} />
        <Route path="/statblock/:id" element={<StatBlockView />} />
        <Route path="/new" element={<StatBlockEditor />} />
      </Routes>
    </Layout>
  );
}
