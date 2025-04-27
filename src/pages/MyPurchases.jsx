import { useState } from 'react';

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);

  return (
    <div>
      <h2>Mis Compras</h2>
      {purchases.length > 0 ? (
        <ul>
          {purchases.map((purchase, index) => (
            <li key={index}>
              Compra de ejemplo
            </li>
          ))}
        </ul>
      ) : (
        <p>No tienes compras registradas</p>
      )}
    </div>
  );
};

export default MyPurchases;