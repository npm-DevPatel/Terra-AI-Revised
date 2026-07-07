import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';

const ROLES = ['Developer', 'Architect', 'Engineer', 'Contractor', 'Banker', 'Government', 'Consultant', 'Other'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useTerraStore();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!displayName.trim() || !username.trim() || !role) {
      setError('Name, username, and role are required.');
      return;
    }
    setLoading(true);
    setError('');

    let avatar_url = null;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}.${ext}`, avatarFile, { upsert: true });
      if (!uploadErr && data) {
        const { data: url } = supabase.storage.from('avatars').getPublicUrl(data.path);
        avatar_url = url.publicUrl;
      }
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().replace('@', '').toLowerCase(),
        bio: bio.trim(),
        role,
        ...(avatar_url && { avatar_url }),
      })
      .eq('id', user.id);

    setLoading(false);
    if (updateErr) {
      setError(updateErr.message.includes('unique') ? 'That username is taken.' : updateErr.message);
    } else {
      navigate('/workspace');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Gabarito', 'Inter', system-ui", padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>Terra AI</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f8', margin: '0 0 8px' }}>
            Set up your profile
          </h1>
          <p style={{ fontSize: 14, color: '#4b5563' }}>
            So teammates can find you, mention you, and know who they're working with.
          </p>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #34d399, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)',
            }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={26} color="rgba(255,255,255,0.8)" />
              }
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: '#34d399', border: '2px solid #0a0a0f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={12} color="#0a0a0f" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            placeholder="Full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 14 }}>@</span>
            <input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
              style={{ ...inputStyle, paddingLeft: 30 }}
            />
          </div>
          <textarea
            placeholder="Short bio — e.g. Real estate developer, Nairobi"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />

          {/* Role selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              I am a
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: '7px 14px', borderRadius: 100,
                    background: role === r ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${role === r ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: role === r ? '#34d399' : '#6b7280',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={loading}
            style={{
              background: loading ? '#1f2937' : '#34d399',
              color: loading ? '#4b5563' : '#0a0a0f',
              border: 'none', borderRadius: 100, padding: '13px 24px',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'background 0.15s', marginTop: 4,
            }}
          >
            {loading ? 'Saving…' : <><ArrowRight size={15} /> Go to Workspace</>}
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 14px',
  color: '#e8e8f0', fontSize: 14,
  fontFamily: "'Gabarito','Inter',system-ui",
  outline: 'none', width: '100%',
};
