import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CalendarPage from './pages/Calendar.jsx';
import Workouts from './pages/Workouts.jsx';
import NewWorkout from './pages/NewWorkout.jsx';
import WorkoutDetail from './pages/WorkoutDetail.jsx';
import Exercises from './pages/Exercises.jsx';
import ExerciseDetail from './pages/ExerciseDetail.jsx';
import Progress from './pages/Progress.jsx';
import Analytics from './pages/Analytics.jsx';
import PRs from './pages/PRs.jsx';
import Goals from './pages/Goals.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';

const P = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<P><Dashboard /></P>} />
      <Route path="/calendar" element={<P><CalendarPage /></P>} />
      <Route path="/workouts" element={<P><Workouts /></P>} />
      <Route path="/workouts/new" element={<P><NewWorkout /></P>} />
      <Route path="/workouts/:id" element={<P><WorkoutDetail /></P>} />
      <Route path="/exercises" element={<P><Exercises /></P>} />
      <Route path="/exercises/:id" element={<P><ExerciseDetail /></P>} />
      <Route path="/progress" element={<P><Progress /></P>} />
      <Route path="/analytics" element={<P><Analytics /></P>} />
      <Route path="/prs" element={<P><PRs /></P>} />
      <Route path="/goals" element={<P><Goals /></P>} />
      <Route path="/profile" element={<P><Profile /></P>} />
      <Route path="/settings" element={<P><Settings /></P>} />
    </Routes>
  );
}