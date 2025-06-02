import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const WebPayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Procesando pago...');
  const [userMessage, setUserMessage] = useState('');
  const [purchaseData, setPurchaseData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [resultType, setResultType] = useState(null);

  useEffect(() => {
    const processWebPayReturn = async () => {
      try {
        const token_ws = searchParams.get('token_ws');
        
        const savedPurchase = localStorage.getItem('webpay_purchase');
        if (savedPurchase) {
          setPurchaseData(JSON.parse(savedPurchase));
        }

        if (!token_ws) {
          setStatus('error');
          setResultType('ABANDONED');
          setMessage('Pago cancelado o abandonado');
          setUserMessage('Has cancelado el pago. Puedes intentar nuevamente cuando desees.');
          
          if (savedPurchase) {
            const purchaseInfo = JSON.parse(savedPurchase);
            await cancelPurchase(purchaseInfo.request_id);
          }
          
          return;
        }

        const authToken = await getAccessTokenSilently();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/stocks/buy/webpay/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ token_ws })
        });

        const result = await response.json();
        
        setResultType(result.type);
        setMessage(result.message);
        setUserMessage(result.userMessage);
        setPaymentDetails(result.details);

        switch (result.type) {
          case 'APPROVED':
            setStatus('success');
            localStorage.removeItem('webpay_purchase');
            setTimeout(() => {
              navigate('/my-purchases');
            }, 5000);
            break;
          case 'REJECTED':
            setStatus('error');
            break;
          case 'ABANDONED':
            setStatus('cancelled');
            break;
          case 'UNCERTAIN':
            setStatus('warning');
            break;
          default:
            setStatus('error');
            break;
        }

      } catch (error) {
        console.error('Error procesando retorno WebPay:', error);
        setStatus('error');
        setResultType('ERROR');
        setMessage('Error procesando el pago');
        setUserMessage('Ocurrió un error técnico procesando tu pago. Por favor, contacta soporte.');
      }
    };

    processWebPayReturn();
  }, [searchParams, navigate, getAccessTokenSilently]);

  const cancelPurchase = async (requestId) => {
    try {
      const authToken = await getAccessTokenSilently();
      await fetch(`${import.meta.env.VITE_API_URL}/stocks/buy/webpay/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ request_id: requestId })
      });
    } catch (error) {
      console.error('Error cancelando compra:', error);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: '⏳',
          title: 'Procesando Pago',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Pago Exitoso',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Pago Fallido',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'cancelled':
        return {
          icon: '🚪',
          title: 'Pago Cancelado',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'warning':
        return {
          icon: '⚠️',
          title: 'Estado Incierto',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: '❓',
          title: 'Estado Desconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className={`max-w-lg w-full ${config.bgColor} rounded-lg shadow-lg border-2 ${config.borderColor} p-6`}>
        <div className="text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          
          <h1 className={`text-2xl font-bold mb-4 ${config.color}`}>
            {config.title}
          </h1>
          
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">{message}</p>
            
            {userMessage && (
              <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                <p className="text-sm">{userMessage}</p>
              </div>
            )}
            
            {purchaseData && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-3 text-gray-800">Detalles de la compra:</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Símbolo:</span>
                    <span className="font-medium">{purchaseData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{purchaseData.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio unitario:</span>
                    <span className="font-medium">${purchaseData.price}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">Total:</span>
                    <span className="font-bold">${purchaseData.total}</span>
                  </div>
                </div>
              </div>
            )}
            
            {paymentDetails && status === 'success' && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-3 text-gray-800">Detalles del pago:</h3>
                <div className="text-sm space-y-2">
                  {paymentDetails.authorization_code && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código autorización:</span>
                      <span className="font-mono text-xs">{paymentDetails.authorization_code}</span>
                    </div>
                  )}
                  {paymentDetails.card_detail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-mono text-xs">****{paymentDetails.card_detail.card_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto pagado:</span>
                    <span className="font-medium">${paymentDetails.amount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-3">
            {status === 'success' && (
              <div className="text-sm text-gray-600 mb-4">
                ⏱️ Serás redirigido automáticamente en unos segundos...
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/my-purchases"
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-center"
              >
                Ver mis compras
              </Link>
              
              {(status === 'error' || status === 'cancelled') && (
                <Link
                  to="/stocks"
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-center"
                >
                  Intentar de nuevo
                </Link>
              )}
              
              {status === 'warning' && (
                <a
                  href="mailto:soporte@stockmarket.com"
                  className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors text-center"
                >
                  Contactar Soporte
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPayReturn;