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

const { createRepositoryTransfer } =
  await import('../../action/organization/create-repository-transfer.js')

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
        create_repository_transfer_current_organization: 'issue-ops',
        create_repository_transfer_target_organization: 'not-issue-ops',
        create_repository_transfer_name: 'self-service'
      })
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates a repository transfer (demo mode)', async () => {
    await createRepositoryTransfer(issueOpsInputs)

    expect(mocktokit.rest.repos.transfer).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates a repository transfer (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await createRepositoryTransfer(issueOpsInputs)

    expect(mocktokit.rest.repos.transfer).toHaveBeenCalledWith({
      owner: 'issue-ops',
      repo: 'self-service',
      new_owner: 'not-issue-ops'
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
