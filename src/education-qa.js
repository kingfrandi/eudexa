const educationQA = [
  ['¿Qué es un presupuesto?', 'Es un plan que organiza cuánto dinero recibes, cuánto gastas y cuánto puedes ahorrar durante un período determinado.'],
  ['¿Por qué es importante ahorrar?', 'Ahorrar permite crear un fondo para emergencias, alcanzar objetivos y afrontar gastos futuros sin depender necesariamente de deuda.'],
  ['¿Qué es un fondo de emergencia?', 'Es dinero reservado para gastos inesperados, como una reparación, una pérdida temporal de ingresos o una emergencia familiar.'],
  ['¿Qué es la inflación?', 'Es el aumento generalizado de los precios de bienes y servicios con el tiempo. Cuando los precios suben, el dinero suele perder poder adquisitivo.'],
  ['¿Qué significa poder adquisitivo?', 'Es la cantidad de bienes y servicios que puedes comprar con una determinada cantidad de dinero.'],
  ['¿Qué es el interés?', 'Es el costo de utilizar dinero prestado o, en otros casos, la cantidad que puedes recibir por mantener dinero en un producto financiero que paga intereses.'],
  ['¿Qué es el interés compuesto?', 'Es el crecimiento generado cuando los intereses obtenidos se suman al capital y posteriormente también generan intereses.'],
  ['¿Qué es una deuda?', 'Es una obligación de devolver dinero recibido previamente, normalmente bajo unas condiciones y, en muchos casos, pagando intereses.'],
  ['¿Qué diferencia hay entre una tarjeta de débito y una de crédito?', 'La débito utiliza fondos disponibles en tu cuenta. La crédito permite utilizar una línea de crédito que posteriormente debes pagar según las condiciones del emisor.'],
  ['¿Qué es una tasa de interés?', 'Es el porcentaje utilizado para calcular cuánto cuesta pedir dinero prestado o cuánto rendimiento genera determinado dinero depositado o invertido.'],
  ['¿Qué es una acción?', 'Es una participación en la propiedad de una empresa. Su precio puede subir o bajar según las condiciones del mercado y las expectativas sobre la compañía.'],
  ['¿Qué es un bono?', 'Es un instrumento de deuda mediante el cual un emisor obtiene financiación y se compromete a devolver el principal bajo determinadas condiciones, normalmente con intereses.'],
  ['¿Qué es una criptomoneda?', 'Es un activo digital que utiliza tecnología criptográfica y, normalmente, una red distribuida para registrar y verificar transacciones.'],
  ['¿Qué es Bitcoin?', 'Bitcoin es un activo digital descentralizado diseñado para permitir transferencias de valor sin depender de una autoridad central que controle la red.'],
  ['¿Qué es diversificar?', 'Es distribuir el dinero entre diferentes activos o categorías para evitar depender completamente del comportamiento de una sola inversión o fuente.'],
  ['¿Qué es el riesgo financiero?', 'Es la posibilidad de que un resultado financiero sea diferente al esperado, incluyendo la posibilidad de perder dinero.'],
  ['¿Qué es la liquidez?', 'Es la facilidad y rapidez con la que un activo puede convertirse en dinero sin una pérdida significativa de valor.'],
  ['¿Qué es el patrimonio neto?', 'Es la diferencia entre lo que posees y lo que debes. En términos simples: activos menos pasivos.'],
  ['¿Qué es un activo?', 'Es un recurso que posee una persona o empresa y que tiene un valor económico, como dinero, propiedades, inversiones o determinados bienes.'],
  ['¿Qué es un pasivo?', 'Es una obligación financiera o deuda que una persona o empresa tiene que pagar.'],
  ['¿Qué es el S&P 500?', 'Es un índice bursátil que sigue el comportamiento de un grupo amplio de grandes empresas estadounidenses y se utiliza como referencia del mercado de acciones de EE. UU.'],
  ['¿Qué es el mercado de divisas?', 'Es el mercado global donde se compran y venden monedas, como el dólar estadounidense, el euro o el yen.'],
  ['¿Qué significa USD?', 'USD es el código internacional de tres letras utilizado para identificar el dólar estadounidense.'],
  ['¿Qué significa DOP?', 'DOP es el código internacional de tres letras utilizado para identificar el peso dominicano.'],
  ['¿Qué es una tasa de cambio?', 'Es la relación de valor entre dos monedas. Por ejemplo, indica cuántos pesos dominicanos equivalen a una unidad de otra moneda.'],
  ['¿Qué es una inversión?', 'Es destinar dinero o recursos a un activo o proyecto con la expectativa de obtener un resultado futuro, asumiendo que existe riesgo.'],
  ['¿Ahorrar e invertir es lo mismo?', 'No. Ahorrar normalmente busca conservar dinero y mantenerlo disponible para objetivos o necesidades. Invertir busca obtener un rendimiento y generalmente implica asumir algún nivel de riesgo.'],
  ['¿Qué es el costo de oportunidad?', 'Es el valor de la alternativa que dejas de elegir cuando utilizas tus recursos, como dinero o tiempo, en otra opción.'],
  ['¿Qué es un gasto fijo?', 'Es un gasto que suele mantenerse relativamente estable de un período a otro, como ciertos alquileres o cuotas.'],
  ['¿Qué es un gasto variable?', 'Es un gasto cuyo monto puede cambiar según el consumo o las circunstancias, como alimentación, transporte o entretenimiento.']
];

function renderEducationQA() {
  const section = document.getElementById('education');
  if (!section || section.dataset.qaReady === '1') return;
  section.dataset.qaReady = '1';
  const lang = localStorage.getItem('lang') || 'ES';
  const title = lang === 'ES' ? 'Preguntas y respuestas financieras' : 'Financial questions and answers';
  const intro = lang === 'ES' ? 'Aprende conceptos financieros de forma sencilla, rápida y práctica.' : 'Learn financial concepts in a simple, quick and practical way.';
  const items = educationQA.map(([question, answer], index) => `<details class="educationQA"><summary>${index + 1}. ${question}</summary><p>${answer}</p></details>`).join('');
  const block = document.createElement('div');
  block.className = 'education-qa-block';
  block.innerHTML = `<div class="education-qa-heading"><h3>${title}</h3><p>${intro}</p></div><div class="education-qa-list">${items}</div>`;
  section.appendChild(block);
}

renderEducationQA();
new MutationObserver(renderEducationQA).observe(document.body, { childList: true, subtree: true });
