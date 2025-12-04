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

const { createOrganizationInvitation } =
  await import('../../action/enterprise/create-organization-invitation.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('createOrganizationInvitation', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    core.getInput.mockReturnValue(
      JSON.stringify({
        create_organization_invitation_organization: 'issue-ops',
        create_organization_invitation_handle: 'mona',
        create_organization_invitation_role: 'Direct Member'
      })
    )

    mocktokit.paginate.mockResolvedValue([])

    mocktokit.rest.users.getByUsername.mockResolvedValue({
      data: {
        id: '1234567890'
      }
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates an organization invitation (demo mode)', async () => {
    await createOrganizationInvitation(issueOpsInputs)

    expect(mocktokit.rest.orgs.createInvitation).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Does nothing if there is a pending invitation', async () => {
    mocktokit.paginate.mockResolvedValue([
      {
        login: 'mona',
        id: '1234567890'
      }
    ])

    await createOrganizationInvitation(issueOpsInputs)

    expect(mocktokit.rest.orgs.createInvitation).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates a repository transfer (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await createOrganizationInvitation(issueOpsInputs)

    expect(mocktokit.rest.orgs.createInvitation).toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
