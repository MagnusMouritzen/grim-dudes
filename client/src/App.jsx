import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import StatBlockList from './components/StatBlockList';
import StatBlockView from './components/StatBlockView';
import StatBlockMultiView from './components/StatBlockMultiView';
import StatBlockEditor from './components/StatBlockEditor';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StatBlockList />} />
        <Route path="/view" element={<StatBlockMultiView />} />
        <Route path="/statblock/:id" element={<StatBlockView />} />
        <Route path="/new" element={<StatBlockEditor />} />
        <Route path="/statblock/:id/edit" element={<StatBlockEditor />} />
      </Routes>
    </Layout>
  );
}
