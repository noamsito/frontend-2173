import { useEffect, useState } from "react";
import { getStocks } from "./api/stocks";

export default function TestStocks() {
    const [stocks, setStocks] = useState([]);

    useEffect(() => {
        getStocks().then((data) => {
            console.log("Respuesta del backend:",data);
            setStocks(data.data);
        });
    }, []);

    return (
        <div>
            <h2>Test de conexión con backend</h2>
            <ul>
                {Array.isArray(stocks) && stocks.length > 0 ? (
                    stocks.map((stock,i)=>(
                        <li key={i}>
                            <strong>{stock.symbol}</strong> - {stock.shortName} - ${stock.price}
                        </li>
                    ))
                ) : (
                    <li>Cargando o no se recibieron datos...</li>
                )}
            </ul>
        </div>
    );
}