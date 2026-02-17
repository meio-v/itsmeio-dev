import type { MDXComponents } from "mdx/types";
import { CopyButton } from "./CopyButton";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText(
      (node as React.ReactElement<{ children?: React.ReactNode }>).props
        .children
    );
  }
  return "";
}

const heading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const Tag = `h${level}` as const;
  const sizes = { 1: 22, 2: 18, 3: 15, 4: 14, 5: 13, 6: 12 };

  return function MdxHeading({ children }: { children?: React.ReactNode }) {
    return (
      <Tag
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: sizes[level],
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--psx-mgs-text-bright)",
          margin: `${level === 1 ? 0 : 32}px 0 16px`,
          lineHeight: 1.4,
        }}
      >
        {">"} {children}
      </Tag>
    );
  };
};

function MdxParagraph({ children }: { children?: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 14,
        lineHeight: 1.8,
        color: "var(--psx-muted)",
        margin: "16px 0",
      }}
    >
      {children}
    </p>
  );
}

function MdxStrong({ children }: { children?: React.ReactNode }) {
  return (
    <strong style={{ color: "var(--psx-text)", fontWeight: 600 }}>
      {children}
    </strong>
  );
}

function MdxBlockquote({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        border: "2px solid var(--psx-border)",
        background: "var(--psx-box-grad)",
        padding: 20,
        margin: "24px 0",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          border: "1px solid var(--psx-inner-border)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

function MdxUl({ children }: { children?: React.ReactNode }) {
  return (
    <ul
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 14,
        lineHeight: 1.8,
        color: "var(--psx-muted)",
        margin: "16px 0",
        paddingLeft: 24,
        listStyleType: "none",
      }}
    >
      {children}
    </ul>
  );
}

function MdxLi({ children }: { children?: React.ReactNode }) {
  return (
    <li style={{ marginBottom: 8, position: "relative", paddingLeft: 16 }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          color: "var(--psx-mgs-text)",
        }}
      >
        {">"}
      </span>
      {children}
    </li>
  );
}

function MdxInlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 13,
        background: "var(--psx-mgs-bg)",
        color: "var(--psx-mgs-text)",
        padding: "2px 6px",
        borderRadius: 2,
      }}
    >
      {children}
    </code>
  );
}

function MdxHr() {
  return (
    <div
      style={{
        height: 8,
        margin: "32px 0",
        opacity: 0.2,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='2' height='2' fill='currentColor'/%3E%3Crect x='4' y='4' width='2' height='2' fill='currentColor'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

function MdxPre({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
>) {
  const codeText = extractText(children);

  return (
    <div style={{ position: "relative", margin: "24px 0" }}>
      <div
        style={{
          padding: 3,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'0\' y=\'0\' width=\'2\' height=\'2\' fill=\'rgba(100,190,100,0.15)\'/%3E%3Crect x=\'2\' y=\'2\' width=\'2\' height=\'2\' fill=\'rgba(100,190,100,0.15)\'/%3E%3C/svg%3E")',
          backgroundRepeat: "repeat",
        }}
      >
        <pre
          {...props}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            lineHeight: 1.7,
            background: "var(--psx-mgs-bg)",
            color: "var(--psx-mgs-text)",
            padding: "20px",
            overflow: "auto",
            margin: 0,
          }}
        >
          {children}
        </pre>
      </div>
      <CopyButton text={codeText} />
    </div>
  );
}

function MdxAnchor({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        color: "var(--psx-mgs-text-bright)",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: 3,
      }}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function MdxImage({
  src,
  alt,
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <span
      style={{
        display: "block",
        margin: "24px 0",
        border: "2px solid var(--psx-border)",
        padding: 3,
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'0\' y=\'0\' width=\'2\' height=\'2\' fill=\'rgba(100,190,100,0.15)\'/%3E%3Crect x=\'2\' y=\'2\' width=\'2\' height=\'2\' fill=\'rgba(100,190,100,0.15)\'/%3E%3C/svg%3E")',
        backgroundRepeat: "repeat",
      }}
    >
      <img
        src={src}
        alt={alt ?? ""}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
      />
    </span>
  );
}

function MdxEm({ children }: { children?: React.ReactNode }) {
  return (
    <em
      style={{
        fontStyle: "italic",
        color: "var(--psx-muted)",
      }}
    >
      {children}
    </em>
  );
}

export const mdxComponents: MDXComponents = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
  p: MdxParagraph,
  strong: MdxStrong,
  blockquote: MdxBlockquote,
  ul: MdxUl,
  li: MdxLi,
  code: MdxInlineCode,
  pre: MdxPre,
  hr: MdxHr,
  a: MdxAnchor,
  img: MdxImage,
  em: MdxEm,
};
