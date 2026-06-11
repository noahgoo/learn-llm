import type { MDXComponents } from "mdx/types";
import { Cite } from "@/components/ui/Cite";

/**
 * Components available in every MDX file without imports — content authors
 * write `<Cite id="vaswani2017" />` directly.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Cite,
    ...components,
  };
}
