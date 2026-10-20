'use client';
import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { entities, courseFields, type Field, type EntityName } from '@/lib/admin-model';
import { api } from './client-api';
import type { SiteContent } from '@/lib/defaults';
export type Row = Record<string, unknown>;
export function string(row: Row, key: string) {
  return String(row[key] ?? '');
}
function localDate(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function toValues(fields: Field[], row: Row) {
  const v: Row = {};
  for (const f of fields)
    v[f.key] =
      f.type === 'datetime-local'
        ? localDate(row[f.key])
        : (row[f.key] ??
          (f.type === 'checkbox' ? 0 : f.type === 'number' ? 1 : (f.options?.[0] ?? '')));
  return v;
}
function normalized(fields: Field[], values: Row) {
  const v: Row = {};
  for (const f of fields) {
    const value = values[f.key];
    v[f.key] =
      f.type === 'number'
        ? value === ''
          ? null
          : Number(value)
        : f.type === 'checkbox'
          ? Number(!!value)
          : f.type === 'datetime-local'
            ? value
              ? new Date(String(value)).toISOString()
              : null
            : (value ?? '');
  }
  return v;
}
export function Fields({
  fields,
  values,
  setValues,
  options = {},
}: {
  fields: Field[];
  values: Row;
  setValues: (values: Row) => void;
  options?: Record<string, Row[]>;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => {
        const change = (value: unknown) => setValues({ ...values, [f.key]: value });
        const parent = options[f.key];
        return (
          <label className={'field ' + (f.type === 'textarea' ? 'full' : '')} key={f.key}>
            <span>{f.label}</span>
            {f.type === 'checkbox' ? (
              <input
                type="checkbox"
                style={{ width: 20 }}
                checked={!!values[f.key]}
                onChange={(e) => change(e.target.checked ? 1 : 0)}
              />
            ) : parent || f.type === 'select' ? (
              <select
                value={String(values[f.key] ?? '')}
                onChange={(e) => change(e.target.value)}
                required={f.required}
              >
                {!f.required && <option value="">None</option>}
                {parent
                  ? parent.map((row) => (
                      <option key={string(row, 'id')} value={string(row, 'id')}>
                        {string(row, 'title')}
                      </option>
                    ))
                  : f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                value={String(values[f.key] ?? '')}
                onChange={(e) => change(e.target.value)}
                required={f.required}
                maxLength={30000}
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={String(values[f.key] ?? '')}
                onChange={(e) => change(e.target.value)}
                required={f.required}
                min={f.type === 'number' ? 1 : undefined}
              />
            )}{' '}
            {f.hint && <small>{f.hint}</small>}
          </label>
        );
      })}
    </div>
  );
}
export function EntityEditor({
  entity,
  record,
  csrf,
  onClose,
  onSaved,
}: {
  entity: EntityName;
  record: Row | null;
  csrf: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const spec = entities[entity];
  const [values, setValues] = useState<Row>(
      toValues(spec.fields, record ?? { position: 1, published: 1 }),
    ),
    [parents, setParents] = useState<Record<string, Row[]>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([
      api<Row[]>('admin/weeks'),
      api<Row[]>('admin/modules'),
      api<Row[]>('admin/lessons'),
    ])
      .then(([weeks, modules, lessons]) => {
        setParents({ week_id: weeks, module_id: modules, lesson_id: lessons });
        if (!record)
          setValues((v) => ({
            ...v,
            week_id: weeks[0]?.id ?? '',
            module_id: modules[0]?.id ?? '',
          }));
      })
      .catch((e) => setError(e.message));
  }, [record]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = normalized(spec.fields, values);
      if (!['modules', 'lessons'].includes(entity)) data.course_id = 'ai-web-2026';
      await api('admin/' + entity, { id: record?.id, data }, csrf);
      onSaved();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="editor-panel" onSubmit={save}>
      <div className="toolbar">
        <h3 style={{ fontWeight: 700 }}>
          {record ? 'Edit' : 'Create'} {spec.label.toLowerCase()}
        </h3>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close editor">
          <X size={15} />
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <Fields fields={spec.fields} values={values} setValues={setValues} options={parents} />
      <div className="form-actions">
        <button className="btn" disabled={busy}>
          <Save size={14} />
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn btn-light" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
export function SettingsEditor({
  record,
  csrf,
  onSaved,
}: {
  record: Row;
  csrf: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(toValues(courseFields, record)),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('admin/settings', normalized(courseFields, values), csrf);
      setMessage(
        'Program settings saved. New checkouts use these settings; existing transaction quotes remain valid.',
      );
      onSaved();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="card" onSubmit={save}>
      <h2>Program & enrollment settings</h2>
      <div className="notice">
        Prices use currency subunits. Dates entered below use your browser’s local timezone; public
        dates use the configured program timezone.
      </div>
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <Fields fields={courseFields} values={values} setValues={setValues} />
      <div className="form-actions">
        <button className="btn" disabled={busy}>
          <Save size={14} />
          {busy ? 'Saving…' : 'Save program settings'}
        </button>
      </div>
    </form>
  );
}
const websiteFields: Field[] = [
  { key: 'heroHeadline', label: 'Hero headline', required: true },
  { key: 'heroDescription', label: 'Hero description', type: 'textarea', required: true },
  { key: 'tagline', label: 'Tagline', required: true },
  { key: 'logoText', label: 'Logo text', required: true },
  { key: 'accentColor', label: 'Brand accent (hex color)', required: true },
  { key: 'logoUrl', label: 'Custom logo URL (optional)', type: 'url' },
  { key: 'instructorName', label: 'Faculty heading or name', required: true },
  { key: 'instructorBio', label: 'Faculty biography', type: 'textarea' },
  { key: 'instructorImage', label: 'Faculty portrait URL', type: 'url' },
  { key: 'instructorExperience', label: 'Faculty details or experience' },
  { key: 'supportEmail', label: 'Support email' },
  { key: 'whatsapp', label: 'WhatsApp URL (https://wa.me/…) ', type: 'url' },
  { key: 'footerText', label: 'Footer introduction', type: 'textarea' },
];
export function WebsiteEditor({ record, csrf }: { record: SiteContent; csrf: string }) {
  const [values, setValues] = useState<SiteContent>(record),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('admin/website', values, csrf);
      setMessage('Website content saved. Public pages now use the updated content.');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function repeater(key: 'benefits' | 'faqs' | 'socialLinks', labels: string[]) {
    const rows = values[key] as unknown as Record<string, string>[];
    return (
      <div className="card">
        <h2>
          {key === 'faqs'
            ? 'Frequently asked questions'
            : key === 'benefits'
              ? 'Program benefits'
              : 'Social links'}
        </h2>
        <div className="stack">
          {rows.map((row, i) => (
            <div className="editor-panel" key={i} style={{ margin: 0 }}>
              <div className="form-grid">
                {Object.entries(row).map(([field, value], j) => (
                  <label className={'field ' + (j === 1 ? 'full' : '')} key={field}>
                    <span>{labels[j] ?? field}</span>
                    {j === 1 && key !== 'socialLinks' ? (
                      <textarea
                        value={value}
                        required
                        onChange={(event) =>
                          setValues({
                            ...values,
                            [key]: rows.map((r, n) =>
                              n === i ? { ...r, [field]: event.target.value } : r,
                            ),
                          })
                        }
                      />
                    ) : (
                      <input
                        value={value}
                        required
                        type={field === 'url' ? 'url' : 'text'}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            [key]: rows.map((r, n) =>
                              n === i ? { ...r, [field]: event.target.value } : r,
                            ),
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="text-link"
                style={{ marginTop: 15 }}
                onClick={() => setValues({ ...values, [key]: rows.filter((_, n) => n !== i) })}
              >
                <Trash2 size={12} style={{ display: 'inline', marginRight: 6 }} />
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn btn-light"
          type="button"
          style={{ marginTop: 18 }}
          onClick={() =>
            setValues({
              ...values,
              [key]: [
                ...rows,
                key === 'faqs'
                  ? { question: '', answer: '' }
                  : key === 'benefits'
                    ? { title: '', text: '' }
                    : { label: '', url: '' },
              ],
            })
          }
        >
          <Plus size={14} />
          Add {key === 'faqs' ? 'question' : key === 'benefits' ? 'benefit' : 'link'}
        </button>
      </div>
    );
  }
  return (
    <form className="stack" onSubmit={save}>
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="card">
        <h2>Brand & homepage</h2>
        <Fields
          fields={websiteFields}
          values={values}
          setValues={(v) => setValues(v as SiteContent)}
        />
      </div>
      {repeater('faqs', ['Question', 'Answer'])}
      {repeater('socialLinks', ['Label', 'URL'])}
      <div>
        <button className="btn" disabled={busy}>
          <Save size={14} />
          {busy ? 'Saving…' : 'Publish website content'}
        </button>
      </div>
    </form>
  );
}
