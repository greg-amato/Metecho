"""
GitHub utilities
"""

from django.conf import settings
from django.core.exceptions import (
    MultipleObjectsReturned,
    ObjectDoesNotExist,
    ValidationError,
)
from github3 import login
from purl import URL


class NoGitHubTokenError(Exception):
    pass


def gh_given_user(user):
    try:
        token = (
            user.socialaccount_set.get(provider="github").socialtoken_set.get().token
        )
    except (ObjectDoesNotExist, MultipleObjectsReturned):
        raise NoGitHubTokenError
    return login(token=token)


def parse_repo_url(repo_url):
    return URL(repo_url).path().split("/")[1:]


# NOTE: not currently used, will be used once we work on stories to make
# tasks with scratch orgs.
def create_branch(user, repo, branch_name):
    gh = gh_given_user(user)
    owner, repo = parse_repo_url(repo)
    repo = gh.repository(owner, repo)
    sha = repo.branch(repo.default_branch).commit.sha
    if settings.DEBUG:
        return None
    else:  # pragma: nocover (hand-tested)
        return repo.create_branch_ref(branch_name, sha)


def get_all_org_repos(user):
    gh = gh_given_user(user)
    repos = set(
        [
            normalize_github_url(repo.url)
            for org in gh.organizations()
            for repo in org.repositories()
            if repo.permissions.get("push", False)
        ]
        + [
            normalize_github_url(repo.url)
            for repo in gh.repositories()
            if repo.permissions.get("push", False)
        ]
    )
    return repos


def normalize_github_url(url):
    # Stupid variable assignment to help Black and the linter get along:
    prefix = "/repos"
    prefix_len = len(prefix)
    suffix = ".git"
    suffix_len = len(suffix)

    url = URL(url).scheme("https").host("www.github.com")
    if url.path().startswith(prefix):
        url = url.path(url.path()[prefix_len:])
    if url.path().endswith(suffix):
        url = url.path(url.path()[:-suffix_len])
    return str(url)


def validate_gh_url(value):
    if value != normalize_github_url(value):
        raise ValidationError(
            "%(value)s should be of the form 'https://www.github.com/:org/:repo'.",
            params={"value": value},
        )