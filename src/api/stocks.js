import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getStocks = async (page = 1, count = 25) => {
    try {
        const response = await axios.get(`${API_URL}/stocks?page=${page}&count=${count}`);
        return response.data;
    } catch (err) {
        console.error("Error al obtener stocks:",err);
        return []
    }
};

export const getStocksbySymbol = async (symbol) => {
    try {
        const response = await axios.get(`${API_URL}/stocks/${symbol}`);
        return response.data;
    } catch (err) {
        console.error(`Error al obtener detalles del simbolo ${symbol}:`,err);
        return null;
    }
};