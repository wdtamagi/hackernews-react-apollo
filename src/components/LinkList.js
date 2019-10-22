import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'

import Link from './Link'

export const FEED_QUERY = gql`
  {
    feed {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`

const LinkList = () => {
  const _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const newLink = subscriptionData.data.newLink
        const exists = prev.feed.links.find(({ id }) => id === newLink.id)
        if (exists) return prev

        return Object.assign({}, prev, {
          feed: {
            links: [...prev.feed.links, newLink],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename,
          },
        })
      },
    })
  }

  const _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION,
    })
  }

  return (
    <Query query={FEED_QUERY}>
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>Error</div>

        _subscribeToNewLinks(subscribeToMore)
        _subscribeToNewVotes(subscribeToMore)

        const linksToRender = data.feed.links

        return (
          <div>
            {linksToRender.map((link, index) => (
              <Link key={link.id} link={link} index={index} />
            ))}
          </div>
        )
      }}
    </Query>
  )
}

export default LinkList
