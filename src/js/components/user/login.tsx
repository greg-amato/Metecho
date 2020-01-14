import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import { selectUserState } from '@/store/user/selectors';
import { addUrlParams } from '@/utils/api';
import routes from '@/utils/routes';
import welcomeMatBG from '#/welcome-mat-bg.png';

interface Props extends RouteComponentProps {
  id?: string;
  label?: string | ReactElement;
  from?: { pathname?: string };
}

export const LoginButton = withRouter(
  ({ id = 'login', label, from = {}, location }: Props) => {
    const handleClick = () => {
      /* istanbul ignore else */
      if (window.api_urls.github_login) {
        let { pathname } = (location.state && location.state.from) || from;
        if (!pathname) {
          pathname = window.location.pathname;
        }
        window.location.assign(
          addUrlParams(window.api_urls.github_login(), {
            next: pathname,
          }),
        );
      }
    };

    return (
      <Button
        id={id}
        label={label === undefined ? i18n.t('Log In With GitHub') : label}
        variant="brand"
        disabled={!window.api_urls.github_login}
        onClick={handleClick}
      />
    );
  },
);

const Login = () => {
  const user = useSelector(selectUserState);

  return user ? (
    <Redirect to={routes.home()} />
  ) : (
    <div
      className="slds-welcome-mat
        slds-welcome-mat_info-only
        welcome-container"
    >
      <div className="slds-welcome-mat__content slds-grid welcome-inner">
        <div
          className="slds-welcome-mat__info
            slds-size_1-of-1
            slds-medium-size_1-of-2"
          style={{ backgroundImage: `url(${welcomeMatBG})` }}
        >
          <div className="slds-welcome-mat__info-content">
            <h2 className="slds-welcome-mat__info-title">
              {i18n.t('Welcome to MetaShare!')}
            </h2>
            <div
              className="slds-welcome-mat__info-description
                slds-text-longform"
            >
              <p>{i18n.t('To get started log in with your GitHub account')}</p>
            </div>
            <div className="slds-welcome-mat__info-actions">
              <LoginButton />
            </div>
          </div>
        </div>
        <div
          className="slds-welcome-mat__tiles
            slds-size_1-of-1
            slds-medium-size_1-of-2
            slds-welcome-mat__tiles_info-only
            slds-grid
            slds-grid_vertical
            slds-p-left_xx-large
            slds-p-right_xx-large
            welcome-tile"
        >
          <h3 className="slds-text-heading_large slds-p-bottom_medium">
            {i18n.t('What is MetaShare?')}
          </h3>
          <p className="slds-p-bottom_xx-large">
            {i18n.t(
              'MetaShare is a tool to help collaborate on sharable Salesforce projects.',
            )}
          </p>
          <h4 className="slds-text-heading_small slds-p-bottom_small">
            {i18n.t('What can I do with MetaShare?')}
          </h4>
          <ul>
            <li className="slds-p-bottom_small">
              <Icon
                category="utility"
                name="adduser"
                size="x-small"
                className="slds-m-right_x-small welcome-icon"
              />
              {i18n.t('Assign projects and tasks to members of your team.')}
            </li>
            <li className="slds-p-bottom_small">
              <Icon
                category="utility"
                name="magicwand"
                size="x-small"
                className="slds-m-right_x-small welcome-icon"
              />
              {i18n.t('Easily create a scratch org with the existing project.')}
            </li>
            <li className="slds-p-bottom_small">
              <Icon
                category="utility"
                name="upload"
                size="x-small"
                className="slds-m-right_x-small welcome-icon"
              />
              {i18n.t(
                'Make changes and capture them into a repository on GitHub.',
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
