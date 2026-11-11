import fs from 'fs';
import path from 'path';

const filePath = path.resolve('frontend/src/components/chairman/views/PlatformDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const target = `<button className="primary-button" onClick={() => onNavigate('Hospital Admins', { action: 'create' })}>`;

const replacement = `<button
            className="primary-button"
            style={{ background: '#6d28d9', borderColor: '#5b21b6', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => onNavigate('October 2026 Demonstration')}
          >
            <Sparkles size={15} />
            <span>October 2026 Demonstration</span>
          </button>
          <button className="primary-button" onClick={() => onNavigate('Hospital Admins', { action: 'create' })}>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Successfully patched PlatformDashboard.jsx');
} else {
  console.error('Target not found!');
}
