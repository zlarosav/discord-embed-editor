import React from 'react';
import { validateEmbed } from '../utils/validation';
import { useEmbedStore } from '../state/embedStore';

export const CharacterMeter: React.FC = () => {
  const embed = useEmbedStore(s => s.embed);
  const v = validateEmbed(embed);
  return (
    <div style={{marginTop:12}}>
      <strong>Total:</strong> <span className={v.total.used>v.total.limit? 'counter exceed':'counter'}>{v.total.used}/{v.total.limit}</span>
      {!v.valid && <div style={{marginTop:4}}>
        {v.errors.slice(0,4).map(err => <div key={err} className="error-text">{err}</div>)}
        {v.errors.length>4 && <div className="error-text">...{v.errors.length-4} más</div>}
      </div>}
    </div>
  );
};
