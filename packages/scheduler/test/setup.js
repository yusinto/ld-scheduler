import testdouble from 'testdouble';
import fetchMock from './fetchMock';

global.td = testdouble;
global.fetch = fetchMock;
