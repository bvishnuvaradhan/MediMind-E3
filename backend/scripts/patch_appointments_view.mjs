import fs from 'fs';
import path from 'path';

const filePath = path.resolve('frontend/src/components/chairman/views/AppointmentsView.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Sparkles to lucide-react imports
if (!content.includes('Sparkles,')) {
  content = content.replace(
    /ArrowUpRight,\r?\n} from 'lucide-react';/,
    'ArrowUpRight,\r\n  Sparkles,\r\n} from \'lucide-react\';'
  );
}

// 2. Add onNavigate prop
content = content.replace(
  'export function AppointmentsView() {',
  'export function AppointmentsView({ onNavigate }) {'
);

// 3. Add demonstration button
const targetHeader = `<p>Aggregate platform-wide consultation volume, monthly growth trends, and hospital throughput across member hospitals.</p>
          </div>
        </div>
      </div>`;

const replacementHeader = `<p>Aggregate platform-wide consultation volume, monthly growth trends, and hospital throughput across member hospitals.</p>
          </div>
        </div>

        <div className="view-actions">
          {onNavigate && (
            <button
              className="primary-button"
              style={{ background: '#6d28d9', borderColor: '#5b21b6', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => onNavigate('October 2026 Demonstration')}
            >
              <Sparkles size={15} />
              <span>October 2026 Demonstration (1,128 Target)</span>
            </button>
          )}
        </div>
      </div>`;

content = content.replace(targetHeader.replace(/\r?\n/g, '\r\n'), replacementHeader.replace(/\r?\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched AppointmentsView.jsx');
