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

const { createRepository } =
  await import('../../action/organization/create-repository.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('createRepository', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    core.getInput.mockReturnValue(
      JSON.stringify({
        create_repository_organization: 'issue-ops',
        create_repository_name: 'self-service',
        create_repository_description: 'A self-service repository',
        create_repository_visibility: 'public',
        create_repository_auto_init: {
          selected: ['Enable'],
          unselected: []
        }
      })
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates a repository (demo mode)', async () => {
    await createRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.createInOrg).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates a repository (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await createRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.createInOrg).toHaveBeenCalledWith({
      org: 'issue-ops',
      name: 'self-service',
      description: 'A self-service repository',
      visibility: 'public',
      auto_init: true
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
