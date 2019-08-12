import { ObjectsAction } from '@/store/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES, ObjectTypes } from '@/utils/constants';

export interface Project {
  id: string;
  repository: string;
  name: string;
  slug: string;
  old_slugs: string[];
  description: string;
  branch_url: string;
}
export interface ProjectsByRepositoryState {
  projects: Project[];
  next: string | null;
  notFound: string[];
  fetched: boolean;
}

export interface ProjectsState {
  [key: string]: ProjectsByRepositoryState;
}

const defaultState = {
  projects: [],
  next: null,
  notFound: [],
  fetched: false,
};

const reducer = (
  projects: ProjectsState = {},
  action: ObjectsAction | LogoutAction,
) => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response: { results, next },
        objectType,
        reset,
        filters: { repository },
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && repository) {
        const repositoryProjects = projects[repository] || { ...defaultState };
        if (reset) {
          return {
            ...projects,
            [repository]: {
              ...repositoryProjects,
              projects: results,
              next,
              fetched: true,
            },
          };
        }
        // Store list of known project IDs to filter out duplicates
        const ids = repositoryProjects.projects.map(p => p.id);
        return {
          ...projects,
          [repository]: {
            ...repositoryProjects,
            projects: [
              ...repositoryProjects.projects,
              ...results.filter(p => !ids.includes(p.id)),
            ],
            next,
            fetched: true,
          },
        };
      }
      return projects;
    }
    case 'CREATE_OBJECT_SUCCEEDED': {
      const {
        object,
        objectType,
      }: { object: Project; objectType: ObjectTypes } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && object) {
        const repository = projects[object.repository] || { ...defaultState };
        // Do not store if (somehow) we already know about this project
        if (!repository.projects.filter(p => object.id === p.id).length) {
          return {
            ...projects,
            [object.repository]: {
              ...repository,
              // Prepend new project (projects are ordered by `-created_at`)
              projects: [object, ...repository.projects],
            },
          };
        }
      }
      return projects;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { repository, slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PROJECT && repository) {
        const repositoryProjects = projects[repository] || { ...defaultState };
        if (!object) {
          return {
            ...projects,
            [repository]: {
              ...repositoryProjects,
              notFound: [...repositoryProjects.notFound, slug],
            },
          };
        }
        // Do not store if we already know about this project
        if (
          !repositoryProjects.projects.filter(p => object.id === p.id).length
        ) {
          return {
            ...projects,
            [object.repository]: {
              ...repositoryProjects,
              projects: [...repositoryProjects.projects, object],
            },
          };
        }
      }
      return projects;
    }
  }
  return projects;
};

export default reducer;
