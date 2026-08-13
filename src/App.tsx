import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/auth/AuthPage';
import MaterialsListPage from './pages/materials/MaterialsListPage';
import MaterialFormPage from './pages/materials/MaterialFormPage';
import RecipesListPage from './pages/recipes/RecipesListPage';
import RecipeBuilderPage from './pages/recipes/RecipeBuilderPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/materials" replace />} />
              <Route path="materials" element={<MaterialsListPage />} />
              <Route path="materials/new" element={<MaterialFormPage />} />
              <Route path="materials/:id" element={<MaterialFormPage />} />
              <Route path="recipes" element={<RecipesListPage />} />
              <Route path="recipes/new" element={<RecipeBuilderPage />} />
              <Route path="recipes/:id" element={<RecipeBuilderPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
