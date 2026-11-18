import { churchIconSvg } from "../churches/ChurchIcon";

// Separado do mapa (carregado sob demanda) para o pino fixo do mapa ampliado
// não puxar o Leaflet para o pacote principal.
export const pinSize = 40;
export const pinHeight = 50;

/** Mesmo pino do mapa público, para a secretaria ver como o local vai aparecer. */
export const pinHtml = `<span class="church-map-pin church-map-marker--selected" aria-hidden="true"><span class="church-map-marker">${churchIconSvg}</span></span>`;
