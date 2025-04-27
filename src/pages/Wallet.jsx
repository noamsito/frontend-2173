import { useState } from 'react';

const Wallet = () => {
  const [balance, setBalance] = useState(1000);

  return (
    <div>
      <h2>Mi Billetera</h2>
      <div className="wallet-info">
        <h3>Saldo disponible: ${balance}</h3>
        <button>Recargar saldo</button>
      </div>
    </div>
  );
};

export default Wallet;