import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useParams, Link } from 'react-router-dom';
import { Navbar, Breadcrumb, Container, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.scss';

// Страницы
import Pages from './pages';
const { ServersPage, DatabasesPage, CollectionsPage, ExplorePage, DocumentPage } = Pages;

interface BreadcrumbItem {
  path?: string;
  label: string;
  active: boolean;
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'Dark');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const newBreadcrumbs: BreadcrumbItem[] = [];

    pathParts.forEach((part, index) => {
      const isLast = index === pathParts.length - 1;
      const path = `/${pathParts.slice(0, index + 1).join('/')}`;

      newBreadcrumbs.push({
        path: isLast ? undefined : path,
        label: part,
        active: isLast
      });
    });

    setBreadcrumbs(newBreadcrumbs);
  }, [location]);

  const switchTheme = () => {
    const newTheme = theme === 'Dark' ? 'Light' : 'Dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.classList.toggle('theme-light', newTheme === 'Light');
  };

  return (
    <div className={`main-sheet theme-${theme.toLowerCase()}`}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <div>
          <Navbar.Brand as={Link} to="/">Mongorai</Navbar.Brand>
          <Breadcrumb>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item
                key={index}
                active={crumb.active}
                linkAs={crumb.path ? Link : undefined}
                linkProps={{ to: crumb.path || '' }}
              >
                {crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <Button variant="outline-light" onClick={switchTheme}>
          Switch to {theme === 'Dark' ? 'Light' : 'Dark'}
        </Button>
      </Navbar>

      <Container fluid>
        <Routes>
          <Route path="/" element={<ServersPage />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/servers/:server/databases" element={<DatabasesPage />} />
          <Route path="/servers/:server/databases/:database/collections" element={<CollectionsPage />} />
          <Route path="/servers/:server/databases/:database/collections/:collection" element={<ExplorePage />} />
          <Route path="/servers/:server/databases/:database/collections/:collection/documents/:document" element={<DocumentPage />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
