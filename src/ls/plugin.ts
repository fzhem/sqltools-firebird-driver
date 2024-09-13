import { ILanguageServerPlugin, IConnectionDriverConstructor } from '@sqltools/types';
import FirebirdSQL from './driver';
import { DRIVER_ALIASES } from './../constants';

const FirebirdSQLDriverPlugin: ILanguageServerPlugin = {
  register(server) {
    DRIVER_ALIASES.forEach(({ value }) => {
      server.getContext().drivers.set(value, FirebirdSQL as IConnectionDriverConstructor);
    });
  }
}

export default FirebirdSQLDriverPlugin;