import React from 'react'
import { ConceptHeader } from './ConceptHeader'
import { ConceptHero } from './ConceptHero'
import { SectionBlock } from './SectionBlock'
import { GalleryStrip } from './GalleryStrip'
import { ConceptFooter } from './ConceptFooter'
import { content } from '../data/content'

export function ConceptHomepage({ theme, themeId, showSelectButton = true }) {
  const { hero, intro, accommodations, dining, amenities, family, weddings, membership, gallery, nav, footer } = content

  return (
    <div
      className="border-t"
      style={{ borderColor: c.border }}
      data-concept={themeId}
    >
      <ConceptHeader
        theme={theme}
        themeId={themeId}
        navLinks={nav.links.map((l) => ({
          ...l,
          href: `#${themeId}-${l.href.replace('#', '')}`,
        }))}
      />
      <ConceptHero theme={theme} themeId={themeId} hero={hero} />

      <SectionBlock
        theme={theme}
        heading={intro.heading}
        description={intro.body}
        image={null}
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-accommodations`}
        heading={accommodations.heading}
        subheading={accommodations.subheading}
        description={accommodations.description}
        cta={accommodations.cta}
        image={accommodations.image}
        image2={accommodations.image2}
        altBg
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-dining`}
        heading={dining.heading}
        subheading={dining.subheading}
        description={dining.description}
        cta={dining.cta}
        image={dining.image}
        imageLeft
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-amenities`}
        heading={amenities.heading}
        subheading={amenities.subheading}
        description={amenities.description}
        cta={amenities.cta}
        image={amenities.image}
        image2={amenities.image2}
        altBg
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-family`}
        heading={family.heading}
        subheading={family.subheading}
        description={family.description}
        cta={family.cta}
        image={family.image}
        imageLeft
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-weddings`}
        heading={weddings.heading}
        subheading={weddings.subheading}
        description={weddings.description}
        cta={weddings.cta}
        image={weddings.image}
        altBg
      />

      <SectionBlock
        theme={theme}
        id={`${themeId}-membership`}
        heading={membership.heading}
        subheading={membership.subheading}
        description={membership.description}
        cta={membership.cta}
        image={membership.image}
        imageLeft
      />

      <GalleryStrip theme={theme} images={gallery.images} />

      <ConceptFooter theme={theme} footer={footer} />

      {showSelectButton && (
        <div
          className="flex justify-center border-t py-8"
          style={{ borderColor: c.border, backgroundColor: c.bgAlt }}
        >
          <button
            type="button"
            className="rounded-sm px-6 py-3 font-sans text-sm font-medium tracking-wide transition-opacity hover:opacity-90"
            style={{
              backgroundColor: c.primary,
              color: c.bg,
            }}
          >
            Select this direction
          </button>
        </div>
      )}
    </div>
  )
}
