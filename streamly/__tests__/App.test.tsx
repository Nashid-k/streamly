/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import PlayerScreen from '../src/screens/PlayerScreen';
import { APP_TABS } from '../src/navigation/AppNavigator';

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {
    trigger: jest.fn(),
  },
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
    }),
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('includes a Search tab in the app navigation', async () => {
  expect(APP_TABS).toContain('Search');
});

test('player keeps the default CineSrc experience without any ad-blocking interception and supports a VIDEM provider fallback', () => {
  jest.useFakeTimers();

  let defaultTree;
  let videmTree;
  act(() => {
    defaultTree = ReactTestRenderer.create(
      <PlayerScreen route={{ params: { tmdbId: '123', type: 'movie', title: 'Test Movie' } }} />,
    );
    videmTree = ReactTestRenderer.create(
      <PlayerScreen route={{ params: { tmdbId: '27205', type: 'movie', provider: 'videm', title: 'Test Movie' } }} />,
    );
  });

  const defaultWebView = defaultTree.root.findByType('WebView');
  const videmWebView = videmTree.root.findByType('WebView');
  expect(defaultWebView.props.injectedJavaScript).toBeUndefined();
  expect(defaultWebView.props.source.uri).toBe('https://cinesrc.st/embed/movie/123?color=%23e50914&autoplay=true&controls=true&back=close');
  expect(videmWebView.props.source.uri).toBe('https://videm.xyz/embed/movie/27205?autoplay=true');
  expect(defaultWebView.props.onShouldStartLoadWithRequest({ url: 'https://pubads.g.doubleclick.net/ads', isTopFrame: true })).toBe(true);
  expect(defaultWebView.props.onShouldStartLoadWithRequest({ url: 'https://cinesrc.st/embed/movie/123', isTopFrame: true })).toBe(true);
  expect(defaultWebView.props.onShouldStartLoadWithRequest({ url: 'https://challenge.cloudflare.com/cdn-cgi/challenge-platform/h/b/cf/123', isTopFrame: true })).toBe(true);

  act(() => {
    defaultTree.unmount();
    videmTree.unmount();
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});
