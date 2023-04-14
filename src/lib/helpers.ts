/* eslint no-console:0 */
'use strict';
export const uniqueID = () => '_' + Math.random().toString(36).substr(2, 9);

export const isArrayUsable = arr => arr && Array.isArray(arr) && arr.length !== 0;
