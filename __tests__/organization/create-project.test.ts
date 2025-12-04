import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/@actions/core.js'
import * as github from '../../__fixtures__/@actions/github.js'
import * as octokit from '../../__fixtures__/@octokit/rest.js'
import * as issues from '../../__fixtures__/utils/issues.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@octokit/rest', () => {
  class Octokit {
    constructor() {
      return octokit
    }
  }

  return {
    Octokit
  }
})

jest.unstable_mockModule('../../action/utils/issues.js', () => issues)

const { createProject } =
  await import('../../action/organization/create-project.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('createRepositoryTransfer', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    core.getInput.mockReturnValue(
      JSON.stringify({
        create_project_organization: 'issue-ops',
        create_project_title: 'Project Title',
        create_project_team: 'maintainers',
        create_project_repository: 'self-service'
      })
    )

    mocktokit.rest.orgs.get.mockResolvedValue({
      data: {
        node_id: '1234567890'
      }
    } as any)

    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        node_id: '1234567890'
      }
    } as any)

    mocktokit.rest.teams.getByName.mockResolvedValue({
      data: {
        id: '1234567890'
      }
    } as any)

    mocktokit.graphql.mockResolvedValue({
      data: {
        createProjectV2: {
          projectV2: {
            id: '1234567890'
          }
        }
      }
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates a repository transfer (demo mode)', async () => {
    await createProject(issueOpsInputs)

    expect(mocktokit.graphql).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates a repository transfer (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await createProject(issueOpsInputs)

    expect(mocktokit.graphql).toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
