import fetchMock from 'fetch-mock';

import * as actions from '@/store/user/actions';

import { storeWithThunk } from './../../utils';

describe('login', () => {
  beforeEach(() => {
    window.socket = { subscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('returns LoginAction', () => {
    const user = {
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const expected = {
      type: 'USER_LOGGED_IN',
      payload: user,
    };

    expect(actions.login(user)).toEqual(expected);
  });

  test('subscribes to user ws events', () => {
    const user = {
      id: 'user-id',
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const userSubscription = {
      model: 'user',
      id: 'user-id',
    };
    actions.login(user);

    expect(window.socket.subscribe).toHaveBeenCalledWith(userSubscription);
  });

  describe('with Sentry', () => {
    beforeEach(() => {
      window.Sentry = {
        setUser: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('sets user context', () => {
      const user = {
        username: 'Test User',
        email: 'test@foo.bar',
      };
      actions.login(user);

      expect(window.Sentry.setUser).toHaveBeenCalledWith(user);
    });
  });
});

describe('logout', () => {
  let store;

  beforeEach(() => {
    store = storeWithThunk({});
    fetchMock.postOnce(window.api_urls.account_logout(), {
      status: 204,
      body: {},
    });
    window.socket = { reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('dispatches LogoutAction', () => {
    const loggedOut = {
      type: 'USER_LOGGED_OUT',
    };

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([loggedOut]);
    });
  });

  test('reconnects socket', () => {
    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(window.socket.reconnect).toHaveBeenCalled();
    });
  });

  describe('with Sentry', () => {
    let scope;

    beforeEach(() => {
      scope = {
        clear: jest.fn(),
      };
      window.Sentry = {
        configureScope: cb => cb(scope),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('resets user context', () => {
      expect.assertions(1);
      return store.dispatch(actions.logout()).then(() => {
        expect(scope.clear).toHaveBeenCalled();
      });
    });
  });
});

describe('refetchAllData', () => {
  let url, objectPayload;

  beforeAll(() => {
    url = window.api_urls.repository_list();
    objectPayload = {
      objectType: 'repository',
      url,
      reset: true,
      filters: {},
    };
  });

  describe('success', () => {
    test('GETs user from api', () => {
      const store = storeWithThunk({});
      const user = { id: 'me' };
      fetchMock.getOnce(window.api_urls.user(), user);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedIn = {
        type: 'USER_LOGGED_IN',
        payload: user,
      };
      const repository = {
        id: 'p1',
        name: 'Repository 1',
        slug: 'repository-1',
        description: 'This is a test repository.',
        repo_url: 'http://www.test.test',
      };
      const response = { next: null, results: [repository] };
      fetchMock.getOnce(url, response);
      const repositoriesStarted = {
        type: 'FETCH_OBJECTS_STARTED',
        payload: objectPayload,
      };
      const repositoriesSucceeded = {
        type: 'FETCH_OBJECTS_SUCCEEDED',
        payload: {
          response,
          ...objectPayload,
        },
      };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          succeeded,
          loggedIn,
          repositoriesStarted,
          repositoriesSucceeded,
        ]);
      });
    });

    test('handles missing user', () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(window.api_urls.user(), 401);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded, loggedOut]);
      });
    });
  });

  describe('error', () => {
    test('dispatches REFETCH_DATA_FAILED action', () => {
      const store = storeWithThunk({});
      fetchMock.getOnce(window.api_urls.user(), 500);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const failed = { type: 'REFETCH_DATA_FAILED' };

      expect.assertions(5);
      return store.dispatch(actions.refetchAllData()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
